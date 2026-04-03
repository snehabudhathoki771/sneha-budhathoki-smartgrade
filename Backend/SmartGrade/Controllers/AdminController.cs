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

        // ================= GET USERS =================

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Where(u => u.Role !="Admin")
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.Role,
                    PhotoUrl = string.IsNullOrEmpty(u.PhotoUrl) ? null : u.PhotoUrl
                })
                .ToListAsync();

            return Ok(users);
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

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Role
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
                .AverageAsync(r => (decimal?)r.FinalPercentage) ?? 0;

            var atRiskStudents = await _context.StudentSubjectResults
                .Where(r => r.FinalPercentage < 40)
                .Select(r => r.StudentId)
                .Distinct()
                .CountAsync();

            var subjectFailureRanking = await _context.StudentSubjectResults
                .Include(r => r.Subject)
                .GroupBy(r => r.Subject!.Name)
                .Select(g => new
                {
                    subject = g.Key,
                    failureRate = g.Count(x => x.FinalPercentage < 40) * 100.0 / g.Count()
                })
                .OrderByDescending(x => x.failureRate)
                .ToListAsync();

            var passCount = await _context.StudentSubjectResults
                .CountAsync(r => r.FinalPercentage >= 40);

            var failCount = await _context.StudentSubjectResults
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
                "Admin"
            );

            await LogAction("Exam Force Unpublished", $"Exam: {exam.Name}");

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
            // Notify Teacher (Owner)
            // ===========================

            await _notificationService.CreateAsync(
                exam.CreatedBy,
                "Exam Force Published by Admin",
                $"Admin has published your exam '{exam.Name}'.",
                "Admin"
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
                    "Exam"
                );
            }

            await LogAction("Exam Force Published", $"Exam: {exam.Name}");

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
                .ToListAsync();

            QuestPDF.Settings.License = LicenseType.Community;

            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(40);

                    page.Header()
                        .Text("SmartGrade Analytics Report")
                        .FontSize(20)
                        .Bold()
                        .AlignCenter();

                    page.Content().Column(col =>
                    {
                        col.Spacing(20);

                        col.Item().Text("Exams Per Academic Year").Bold();
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("Year").Bold();
                                header.Cell().Text("Exam Count").Bold();
                            });

                            foreach (var item in examsPerYear)
                            {
                                table.Cell().Text(item.Year);
                                table.Cell().Text(item.Count.ToString());
                            }
                        });

                        col.Item().Text("Pass / Fail Distribution").Bold();
                        col.Item().Text($"Passed: {passCount}");
                        col.Item().Text($"Failed: {failCount}");

                        col.Item().Text("Average Score Per Subject").Bold();
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("Subject").Bold();
                                header.Cell().Text("Average (%)").Bold();
                            });

                            foreach (var item in avgPerSubject)
                            {
                                table.Cell().Text(item.Subject);
                                table.Cell().Text(item.Average.ToString("0.00"));
                            }
                        });

                        col.Item().Text("Teacher Performance Overview").Bold();
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("Teacher").Bold();
                                header.Cell().Text("Average (%)").Bold();
                            });

                            foreach (var item in teacherPerf)
                            {
                                table.Cell().Text(item.Teacher);
                                table.Cell().Text(item.Average.ToString("0.00"));
                            }
                        });
                    });

                    page.Footer()
                        .AlignCenter()
                        .Text($"Generated on {DateTime.UtcNow:dd MMM yyyy HH:mm}");
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

    }
}
