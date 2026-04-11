using DocumentFormat.OpenXml.InkML;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SmartGrade.Data;
using SmartGrade.DTOs;
using SmartGrade.DTOs.Admin;
using SmartGrade.Models;
using SmartGrade.Services;
using System.Security.Claims;

namespace SmartGrade.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AuditService _auditService;
        private readonly NotificationService _notificationService;
        private readonly EmailService _emailService;

        public AdminController(
            AppDbContext context,
            AuditService auditService,
            NotificationService notificationService,
            EmailService emailService   )
        {
            _context = context;
            _auditService = auditService;
            _notificationService = notificationService;
            _emailService = emailService;
        }

        // ================= DASHBOARD =================

        [HttpGet("dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            var totalStudents = await _context.Users.CountAsync(u => u.Role == "Student");
            var totalTeachers = await _context.Users.CountAsync(u => u.Role == "Teacher");
            var totalAdmins = await _context.Users.CountAsync(u => u.Role == "Admin");
            var totalExams = await _context.Exams.CountAsync();
            var publishedExams = await _context.Exams.CountAsync(e => e.Status == "Published");

            return Ok(new
            {
                totalStudents,
                totalTeachers,
                totalAdmins,
                totalExams,
                publishedExams
            });
        }

        [HttpGet("dashboard-overview")]
        public async Task<IActionResult> GetDashboardOverview()
        {
            var totalStudents = await _context.Users.CountAsync(u => u.Role == "Student");
            var totalTeachers = await _context.Users.CountAsync(u => u.Role == "Teacher");
            var totalAdmins = await _context.Users.CountAsync(u => u.Role == "Admin");

            var totalExams = await _context.Exams.CountAsync();
            var publishedExams = await _context.Exams.CountAsync(e => e.Status == "Published");

            var systemAverage = await _context.StudentSubjectResults
                .Where(r => r.Exam != null && r.Exam.Status == "Published")
                .AverageAsync(r => (decimal?)r.FinalPercentage) ?? 0;

            var atRiskStudents = await _context.StudentSubjectResults
                .Where(r => r.Exam != null && r.Exam.Status == "Published")
                .Where(r => r.FinalPercentage < 40)
                .Select(r => r.StudentId)
                .Distinct()
                .CountAsync();

            var subjectFailureRanking = await _context.StudentSubjectResults
                .Include(r => r.Subject)
                .Include(r => r.Exam)
                .Where(r => r.Exam != null) // ensure exam exists
                .Where(r => r.Exam.Status == "Published") //published exams
                .GroupBy(r => new
                {
                    ExamId = r.ExamId,
                    ExamName = r.Exam.Name,
                    SubjectName = r.Subject != null ? r.Subject.Name : "Unknown Subject"
                })
                .Select(g => new
                {
                    exam = g.Key.ExamName,
                    subject = g.Key.SubjectName,
                    failureRate = g.Count() == 0
                        ? 0
                        : g.Count(x => x.FinalPercentage < 40) * 100.0 / g.Count()
                })
                    .OrderByDescending(x => x.failureRate)
                    .ToListAsync();

            var passCount = await _context.StudentSubjectResults
                .Where(r => r.Exam != null && r.Exam.Status == "Published")
                .CountAsync(r => r.FinalPercentage >= 40);

            var failCount = await _context.StudentSubjectResults
                .Where(r => r.Exam != null && r.Exam.Status == "Published")
                .CountAsync(r => r.FinalPercentage < 40);

            return Ok(new
            {
                stats = new
                {
                    totalStudents,
                    totalTeachers,
                    totalAdmins,
                    totalExams,
                    publishedExams
                },

                performance = new
                {
                    systemAverage,
                    atRiskStudents
                },

                charts = new
                {
                    subjectFailureRanking,
                    passCount,
                    failCount
                }
            });
        }
        // ================= GET USERS =================

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Where(u => u.Role != "Admin")
                .ToListAsync();

            foreach (var user in users)
            {
                if (user.DeactivatedUntil != null && user.DeactivatedUntil <= DateTime.UtcNow)
                {
                    user.IsActive = true;
                    user.DeactivatedUntil = null;
                }
            }

            await _context.SaveChangesAsync();

            var result = users.Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.Role,
                u.IsActive,
                u.DeactivatedUntil,
                PhotoUrl = string.IsNullOrEmpty(u.PhotoUrl) ? null : u.PhotoUrl
            });

            return Ok(result);
        }

        // ================= CREATE USER =================

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email already exists.");

            var validRoles = new[] { "Student", "Teacher", "Admin" };
            if (!validRoles.Contains(dto.Role))
                return BadRequest("Invalid role.");

            var hashedPassword = HashPassword(dto.Password);

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = hashedPassword,
                Role = dto.Role
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            await LogAction("User Created", $"User: {user.Email}");
            await NotifyAllAdmins(
                "New User Created",
                $"A new {user.Role} account was created: {user.Email}",
                "System"
            );

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Role
            });
        }


        // ================= DELETE USER =================

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound("User not found.");

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized();

            var currentUserId = int.Parse(userIdClaim);

            // Prevent self deletion
            if (user.Id == currentUserId)
                return BadRequest("You cannot delete your own account.");

            // Prevent deleting last admin
            if (user.Role == "Admin")
            {
                var adminCount = await _context.Users.CountAsync(u => u.Role == "Admin");

                if (adminCount <= 1)
                    return BadRequest("Cannot delete the last admin.");
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            
            await LogAction("User Deleted", $"User ID: {user.Id}, Email: {user.Email}");
            await NotifyAllAdmins(
                "User Deleted",
                $"User deleted: {user.Email}",
                "Warning"
            );

            return Ok("User deleted successfully.");
        }

        // ================= GET ALL EXAMS =================
        [HttpGet("exams")]
        public async Task<IActionResult> GetAllExams()
        {
            var exams = await _context.Exams
                .Select(e => new
                {
                    id = e.Id,
                    name = e.Name,
                    academicYear = e.AcademicYear,
                    status = e.Status,
                    teacherName = _context.Users
                        .Where(u => u.Id == e.CreatedBy)
                        .Select(u => u.FullName)
                        .FirstOrDefault(),
                    createdAt = e.CreatedAt
                })
                .ToListAsync();

            return Ok(exams);
        }


        // ================= DELETE EXAM =================

        [HttpDelete("exams/{id}")]
        public async Task<IActionResult> DeleteExam(int id)
        {
            var exam = await _context.Exams.FindAsync(id);

            if (exam == null)
                return NotFound("Exam not found.");

            // Prevent deleting published exam
            if (exam.Status == "Published")
                return BadRequest("Cannot delete a published exam. Unpublish first.");

            _context.Exams.Remove(exam);
            await _context.SaveChangesAsync();
            await NotifyAllAdmins(
                "Exam Deleted",
                $"Exam '{exam.Name}' was deleted by admin",
                "Warning"
            );

            await LogAction("Exam Deleted", $"Exam: {exam.Name}");

            return Ok("Exam deleted successfully.");
        }


        // ================= FORCE UNPUBLISH =================

        [HttpPut("exams/{id}/unpublish")]
        public async Task<IActionResult> ForceUnpublish(int id)
        {
            var exam = await _context.Exams.FindAsync(id);

            if (exam == null)
                return NotFound("Exam not found.");

            if (exam.Status != "Published")
                return BadRequest("Exam is already unpublished.");

            exam.Status = "Draft";
            exam.PublishedAt = null;

            await _context.SaveChangesAsync();

            // ===========================
            //  Notify Teacher
            // ===========================

            await _notificationService.CreateAsync(
                exam.CreatedBy,
                "Exam Unpublished by Admin",
                $"Admin has unpublished your exam '{exam.Name}'.",
                "Admin",
                "Teacher"
            );

            await LogAction("Exam Force Unpublished", $"Exam: {exam.Name}");
            await NotifyAllAdmins(
                "Exam Unpublished",
                $"Exam '{exam.Name}' has been unpublished",
                "Exam"
            );

            return Ok("Exam unpublished successfully.");
        }


        // ================= PASSWORD HASH =================

        private string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        // ================= GET EXAM DETAILS =================

        [HttpGet("exams/{id}")]
        public async Task<IActionResult> GetExamDetails(int id)
        {
            var exam = await _context.Exams
                .Include(e => e.Subjects)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (exam == null)
                return NotFound("Exam not found.");

            var teacherName = await _context.Users
            .Where(u => u.Id == exam.CreatedBy)
            .Select(u => u.FullName)
            .FirstOrDefaultAsync();

            return Ok(new
            {
                id = exam.Id,
                name = exam.Name,
                academicYear = exam.AcademicYear,
                status = exam.Status,
                createdAt = exam.CreatedAt,
                publishedAt = exam.PublishedAt,
                teacherName = teacherName ?? "Unknown",
                subjects = exam.Subjects.Select(s => new
                {
                    id = s.Id,
                    name = s.Name
                })
            });

        }


        // ================= FORCE PUBLISH =================

        [HttpPut("exams/{id}/publish")]
        public async Task<IActionResult> ForcePublish(int id)
        {
            var exam = await _context.Exams.FindAsync(id);

            if (exam == null)
                return NotFound("Exam not found.");

            if (exam.Status == "Published")
                return BadRequest("Exam is already published.");

            exam.Status = "Published";
            exam.PublishedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // ===========================
            // Notify Teacher 
            // ===========================

            await _notificationService.CreateAsync(
                exam.CreatedBy,
                "Exam Force Published by Admin",
                $"Admin has published your exam '{exam.Name}'.",
                "Admin",
                "Teacher"
            );

            // ===========================
            // Notify Students
            // ===========================

            var students = await _context.StudentSubjectResults
                .Where(r => r.ExamId == id)
                .Select(r => r.StudentId)
                .Distinct()
                .ToListAsync();

            foreach (var studentId in students)
            {
                await _notificationService.CreateAsync(
                    studentId,
                    "Exam Published",
                    $"Your exam '{exam.Name}' has been published by admin.",
                    "Exam",
                    "Student"
                );
            }

            await LogAction("Exam Force Published", $"Exam: {exam.Name}");
            await NotifyAllAdmins(
                "Exam Published",
                $"Exam '{exam.Name}' has been published",
                "Exam"
            );

            return Ok("Exam published successfully.");
        }


        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDto model)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound("User not found.");

            if (string.IsNullOrWhiteSpace(model.FullName))
                return BadRequest("Full name is required.");

            if (string.IsNullOrWhiteSpace(model.Email))
                return BadRequest("Email is required.");

            var allowedRoles = new[] { "Student", "Teacher", "Admin" };

            if (!allowedRoles.Contains(model.Role))
                return BadRequest("Invalid role.");

            // Prevent duplicate email
            var emailExists = await _context.Users
                .AnyAsync(u => u.Email == model.Email && u.Id != id);

            if (emailExists)
                return BadRequest("Email already exists.");

            // Prevent removing last admin
            if (user.Role == "Admin" && model.Role != "Admin")
            {
                var adminCount = await _context.Users
                    .CountAsync(u => u.Role == "Admin");

                if (adminCount <= 1)
                    return BadRequest("At least one admin must remain.");
            }

            user.FullName = model.FullName;
            user.Email = model.Email;
            user.Role = model.Role;     

            await _context.SaveChangesAsync();

            return Ok("User updated successfully.");
        }

        // ================= ANALYTICS: EXAMS PER YEAR =================
        [HttpGet("analytics/exams-per-year")]
        public async Task<IActionResult> GetExamsPerYear()
        {
            var data = await _context.Exams
                .GroupBy(e => e.AcademicYear)
                .Select(g => new
                {
                    year = g.Key,
                    count = g.Count()
                })
                .OrderBy(x => x.year)
                .ToListAsync();

            return Ok(data);
        }

        // ================= ANALYTICS: PASS FAIL =================
        [HttpGet("analytics/pass-fail")]
        public async Task<IActionResult> GetPassFailDistribution()
        {
            var passed = await _context.StudentSubjectResults
                .CountAsync(r => r.FinalPercentage >= 40);

            var failed = await _context.StudentSubjectResults
                .CountAsync(r => r.FinalPercentage < 40);

            return Ok(new
            {
                passed,
                failed
            });
        }

        // ================= ANALYTICS: AVG SCORE PER SUBJECT =================
        [HttpGet("analytics/average-score-subject")]
        public async Task<IActionResult> GetAverageScorePerSubject()
        {
            var data = await _context.StudentSubjectResults
                .Include(r => r.Subject)
                .GroupBy(r => r.Subject!.Name)
                .Select(g => new
                {
                    subject = g.Key,
                    averageScore = g.Average(x => x.FinalPercentage)
                })
                .ToListAsync();

            return Ok(data);
        }

        // ================= ANALYTICS: TEACHER PERFORMANCE =================
        [HttpGet("analytics/teacher-performance")]
        public async Task<IActionResult> GetTeacherPerformance()
        {
            var data = await _context.Users
                .Where(u => u.Role == "Teacher")
                .Select(t => new
                {
                    teacherName = t.FullName,
                    averageScore = _context.StudentSubjectResults
                        .Where(r => _context.Exams
                            .Where(e => e.CreatedBy == t.Id)
                            .Select(e => e.Id)
                            .Contains(r.ExamId))
                        .Average(r => (decimal?)r.FinalPercentage) ?? 0
                })
                .ToListAsync();

            return Ok(data);
        }


        private async Task LogAction(string action, string details = "")
        {
            var userName = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";

            var log = new AuditLog
            {
                Action = action,
                PerformedBy = userName,
                Timestamp = DateTime.UtcNow,
                Details = details
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        [HttpGet("analytics/report")]
        public async Task<IActionResult> DownloadAnalyticsReport()
        {
            var examsPerYear = await _context.Exams
                .GroupBy(e => e.AcademicYear)
                .Select(g => new
                {
                    Year = g.Key,
                    Count = g.Count()
                })
                .OrderBy(x => x.Year)
                .ToListAsync();

            var passCount = await _context.StudentSubjectResults
                .CountAsync(r => r.FinalPercentage >= 40);

            var failCount = await _context.StudentSubjectResults
                .CountAsync(r => r.FinalPercentage < 40);

            var avgPerSubject = await _context.StudentSubjectResults
                .Include(r => r.Subject)
                .GroupBy(r => r.Subject!.Name)
                .Select(g => new
                {
                    Subject = g.Key,
                    Average = g.Average(x => x.FinalPercentage)
                })
                .ToListAsync();

            var teacherPerf = await _context.Users
                .Where(u => u.Role == "Teacher")
                .Select(t => new
                {
                    Teacher = t.FullName,
                    Average = _context.StudentSubjectResults
                        .Where(r => _context.Exams
                            .Where(e => e.CreatedBy == t.Id)
                            .Select(e => e.Id)
                            .Contains(r.ExamId))
                        .Average(r => (decimal?)r.FinalPercentage) ?? 0
                })
                .OrderByDescending(x => x.Average)
                .ToListAsync();

            int totalStudents = passCount + failCount;

            decimal averageScore = avgPerSubject.Any()
                ? Math.Round(avgPerSubject.Average(x => x.Average), 2)
                : 0;

            decimal highestScore = avgPerSubject.Any()
                ? Math.Round(avgPerSubject.Max(x => x.Average), 2)
                : 0;

            int passRate = totalStudents > 0
                ? (int)((passCount * 100.0) / totalStudents)
                : 0;

            var topSubject = avgPerSubject.OrderByDescending(x => x.Average).FirstOrDefault();
            var weakSubject = avgPerSubject.OrderBy(x => x.Average).FirstOrDefault();

            string insight = passRate >= 80
                ? "Overall performance is strong with high pass rates."
                : passRate >= 50
                    ? "Performance is moderate. Improvement needed in weaker subjects."
                    : "Performance is low. Immediate academic intervention recommended.";

            QuestPDF.Settings.License = LicenseType.Community;

            var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "SGlogo.png");

            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(30);

                    // ================= HEADER =================
                    page.Header().Background("#1F2A37").Padding(15).Column(header =>
                    {
                        header.Item().Row(row =>
                        {
                            row.ConstantItem(60).Height(60).Image(logoPath);

                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("SMARTGRADE INTERNATIONAL SCHOOL")
                                    .FontSize(18)
                                    .FontColor(Colors.White)
                                    .Bold();

                                c.Item().Text("Analytics Report")
                                    .FontSize(11)
                                    .FontColor(Colors.Grey.Lighten2);
                            });
                        });

                        header.Item().PaddingTop(5)
                            .LineHorizontal(3)
                            .LineColor(Colors.Yellow.Medium);
                    });

                    // ================= CONTENT =================
                    page.Content().PaddingTop(15).Column(col =>
                    {
                        col.Spacing(15);

                        // ================= KPI =================
                        col.Item().Background(Colors.Grey.Lighten3).Padding(10).Column(c =>
                        {
                            c.Item().Text($"Total Students: {totalStudents}");
                            c.Item().Text($"Average Score: {averageScore}%");
                            c.Item().Text($"Highest Score: {highestScore}%");
                            c.Item().Text($"Pass Rate: {passRate}%");
                        });

                        // ================= INSIGHTS =================
                        col.Item().Background(Colors.Blue.Lighten4).Padding(10).Column(c =>
                        {
                            c.Item().Text("Performance Insights").Bold();
                            c.Item().Text($"Top Subject: {topSubject?.Subject} ({topSubject?.Average:0.00}%)");
                            c.Item().Text($"Weakest Subject: {weakSubject?.Subject} ({weakSubject?.Average:0.00}%)");
                            c.Item().Text(insight);
                        });

                        // ================= EXAMS =================
                        col.Item().Text("Exams Per Academic Year").FontSize(14).Bold();

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background("#1F2A37").Padding(6).Text("Year").FontColor(Colors.White);
                                header.Cell().Background("#1F2A37").Padding(6).Text("Exam Count").FontColor(Colors.White);
                            });

                            foreach (var item in examsPerYear)
                            {
                                table.Cell().Padding(5).Text(item.Year);
                                table.Cell().Padding(5).Text(item.Count.ToString());
                            }
                        });

                        // ================= SUBJECT =================
                        col.Item().Text("Average Score Per Subject").FontSize(14).Bold();

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background("#1F2A37").Padding(6).Text("Subject").FontColor(Colors.White);
                                header.Cell().Background("#1F2A37").Padding(6).Text("Average (%)").FontColor(Colors.White);
                            });

                            foreach (var item in avgPerSubject)
                            {
                                table.Cell().Padding(5).Text(item.Subject);
                                table.Cell().Padding(5).Text(item.Average.ToString("0.00"));
                            }
                        });

                        // ================= TEACHER RANKING =================
                        col.Item().Text("Teacher Performance Ranking").FontSize(14).Bold();

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(50);
                                columns.RelativeColumn(3);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background("#1F2A37").Padding(6).Text("Rank").FontColor(Colors.White);
                                header.Cell().Background("#1F2A37").Padding(6).Text("Teacher").FontColor(Colors.White);
                                header.Cell().Background("#1F2A37").Padding(6).Text("Average (%)").FontColor(Colors.White);
                            });

                            int rank = 1;

                            foreach (var item in teacherPerf)
                            {
                                table.Cell().Padding(5).Text(rank.ToString());
                                table.Cell().Padding(5).Text(item.Teacher);
                                table.Cell().Padding(5).Text(item.Average.ToString("0.00"));
                                rank++;
                            }
                        });

                        // ================= FOOTER =================
                        col.Item().PaddingTop(20).Row(row =>
                        {
                            row.RelativeItem().Text($"Date: {DateTime.Now:dd MMM yyyy}");
                            row.RelativeItem().AlignRight().Text("System Administrator");
                        });

                        col.Item().AlignCenter().PaddingTop(30)
                            .Text("SmartGrade © All Rights Reserved")
                            .FontSize(10);
                    });
                });
            }).GeneratePdf();

            return File(pdf, "application/pdf", "SmartGrade_Analytics_Report.pdf");
        }


        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs()
        {
            var logs = await _context.AuditLogs
                .OrderByDescending(a => a.Timestamp)
                .ToListAsync();

            return Ok(logs);
        }

        // ================= GET STUDENT PROFILE =================

        [HttpGet("students/{id}")]
        public async Task<IActionResult> GetStudentProfile(int id)
        {
            var student = await _context.Users
                .Where(u => u.Id == id && u.Role == "Student")
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.Address,
                    u.DateOfBirth,
                    u.Gender,
                    u.GuardianName,
                    u.GuardianPhone,
                    u.PhotoUrl
                })
                .FirstOrDefaultAsync();

            if (student == null)
                return NotFound("Student not found");

            return Ok(student);
        }

        [HttpPut("users/{id}/reset-password")]
        public async Task<IActionResult> ResetUserPassword(int id, [FromBody] AdminResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.NewPassword))
                return BadRequest("Password cannot be empty.");

            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound("User not found.");

            user.PasswordHash = HashPassword(dto.NewPassword);

            await _context.SaveChangesAsync();

            _emailService.SendAdminResetPasswordEmail(
                user.Email,
                user.FullName,
                dto.NewPassword
            );

            await LogAction("Password Reset", $"Admin reset password for {user.Email}");
            await NotifyAllAdmins(
                "Password Reset",
                $"Password reset performed for {user.Email}",
                "Security"
            );

            return Ok("Password reset successfully and email sent.");
        }


        [HttpGet("teachers/{id}")]
        public async Task<IActionResult> GetTeacherProfile(int id)
        {
            var teacher = await _context.Users
                .Where(u => u.Id == id && u.Role == "Teacher")
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.Address,
                    u.DateOfBirth,
                    u.Gender,
                    u.PhotoUrl
                })
                .FirstOrDefaultAsync();

            if (teacher == null)
                return NotFound("Teacher not found");

            return Ok(teacher);
        }


        // ================= ACTIVATE USER =================

        [HttpPut("users/{id}/activate")]
        public async Task<IActionResult> ActivateUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound("User not found.");

            user.IsActive = true;

            await _context.SaveChangesAsync();

            return Ok("User activated successfully.");
        }


        // ================= DEACTIVATE USER =================

        [HttpPut("users/{id}/deactivate")]
        public async Task<IActionResult> DeactivateUser(int id, [FromBody] DeactivateUserDto request)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound();

            user.IsActive = false;

            if (request.Days.HasValue)
            {
                user.DeactivatedUntil = DateTime.UtcNow.AddDays(request.Days.Value);
            }
            else
            {
                user.DeactivatedUntil = null;
            }

            await _context.SaveChangesAsync();

            _emailService.SendAccountDeactivatedEmail(
                user.Email,
                user.FullName,
                user.DeactivatedUntil
            );

            // existing notification
            await _notificationService.CreateAsync(
                user.Id,
                "Account Deactivated",
                "Your account has been deactivated by admin.",
                "Security",
                "Student"
            );

            return Ok(new { message = "User deactivated successfully" });
        }

        private async Task NotifyAllAdmins(string title, string message, string type)
        {
            var admins = await _context.Users
                .Where(u => u.Role == "Admin")
                .Select(u => u.Id)
                .ToListAsync();

            foreach (var adminId in admins)
            {
                await _notificationService.CreateAsync(
                    adminId,
                    title,
                    message,
                    type,
                    "Admin"
                );
            }
        }

    }
}
