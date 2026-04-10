using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using SmartGrade.Data;
using SmartGrade.DTOs.AssessmentSection;
using SmartGrade.DTOs.Exam;
using SmartGrade.DTOs.Marks;
using SmartGrade.DTOs.Subject;
using SmartGrade.Models;
using SmartGrade.Services;
using System;
using System.Diagnostics;
using System.Security.Claims;
using QuestPDF.Helpers;


namespace SmartGrade.Controllers
{
    [ApiController]
    [Route("api/teacher")]
    [Authorize(Roles = "Teacher")]
    public class TeacherController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly FileParserService _fileParserService;
        private readonly BulkImportService _bulkImportService;
        private readonly AnalyticsService _analyticsService;
        private readonly GradeCalculator _gradeCalculator;
        private readonly AuditService _auditService;
        private readonly NotificationService _notificationService;


        public TeacherController(
            AppDbContext context,
            FileParserService fileParserService,
            BulkImportService bulkImportService,
            AnalyticsService analyticsService,
            GradeCalculator gradeCalculator,
            AuditService auditService,
            NotificationService notificationService )
        {
            _context = context;
            _fileParserService = fileParserService;
            _bulkImportService = bulkImportService;
            _analyticsService = analyticsService;
            _gradeCalculator = gradeCalculator;
            _auditService = auditService;
            _notificationService = notificationService;
        }

        [HttpGet("subjects/{subjectId}/analytics")]
        public async Task<IActionResult> GetSubjectAnalytics(int subjectId)
        {
            var result = await _analyticsService
                .GetSubjectAnalyticsAsync(subjectId);

            if (!result.Any())
                return BadRequest("No analytics data found.");

            return Ok(result);
        }

        // BULK UPLOAD - PREVIEW

        [HttpPost("bulk-upload-preview")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> BulkUploadPreview(
            [FromForm] BulkUploadRequestDto request)
        {
            if (request.File == null || request.File.Length == 0)
                return BadRequest("No file uploaded.");

            var section = await _context.AssessmentSections
                .Include(s => s.Subject)
                .FirstOrDefaultAsync(s => s.Id == request.SectionId);

            if (section == null)
                return BadRequest("Invalid section.");

            var parsedRows = await _fileParserService.ParseAsync(request.File);

            var result = await _bulkImportService
                .ValidateAsync(parsedRows, request.SectionId);

            return Ok(result);
        }


        // BULK UPLOAD - CONFIRM

        [HttpPost("bulk-upload-confirm")]
        public async Task<IActionResult> BulkUploadConfirm(
     [FromBody] BulkUploadResultDto model,
     [FromQuery] int sectionId)
        {
            if (model == null || model.RowResults == null)
                return BadRequest("Invalid data.");

            await _bulkImportService.SaveAsync(model.RowResults, sectionId);

            var section = await _context.AssessmentSections
                .Include(s => s.Subject)
                .FirstOrDefaultAsync(s => s.Id == sectionId);

            if (section != null)
            {
                await RecalculateSubjectResults(
                    section.SubjectId,
                    section.Subject!.ExamId
                );
            }

            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            await _notificationService.CreateAsync(
                teacherId,
                "Bulk Upload Completed",
                $"Marks uploaded successfully for section '{section?.Name}'.",
                "System",
                "Teacher"
            );

            return Ok(new
            {
                message = "Bulk import successful.",
                inserted = model.RowResults.Count(r => r.IsValid),
                failed = model.RowResults.Count(r => !r.IsValid)
            });
        }

        private async Task RecalculateSubjectResults(int subjectId, int examId)
        {
            var sections = await _context.AssessmentSections
                .Include(s => s.Subject)
                .Where(s => s.SubjectId == subjectId && s.Subject.ExamId == examId)
                .ToListAsync();

            if (!sections.Any())
                return;

            var studentIds = await _context.StudentMarks
                .Where(sm => sm.SubjectId == subjectId && sm.ExamId == examId)
                .Select(sm => sm.StudentId)
                .Distinct()
                .ToListAsync();

            //  Load grade scales
            var gradeScales = await _context.GradeScales
                .Where(g => g.IsActive)
                .ToListAsync();

            foreach (var studentId in studentIds)
            {
                decimal finalPercentage = 0;
                decimal totalWeightEntered = 0;

                foreach (var section in sections)
                {
                    var mark = await _context.StudentMarks
                        .FirstOrDefaultAsync(sm =>
                            sm.StudentId == studentId &&
                            sm.SectionId == section.Id &&
                            sm.ExamId == examId);

                    if (mark != null && mark.MaxMarks > 0)
                    {
                        decimal sectionPercentage =
                            (mark.MarksObtained / mark.MaxMarks) * 100;

                        decimal contribution =
                            (sectionPercentage * section.Weightage) / 100;

                        finalPercentage += contribution;
                        totalWeightEntered += section.Weightage;
                    }
                }

                decimal calculatedGpa = 0;
                string calculatedGrade = "Pending";

                if (totalWeightEntered == 100)
                {
                    // Use in-memory grade calculation
                    var result = _gradeCalculator
                        .CalculateFromList(finalPercentage, gradeScales);

                    calculatedGpa = result.gpa;
                    calculatedGrade = result.grade;
                }

                var existing = await _context.StudentSubjectResults
                    .FirstOrDefaultAsync(r =>
                        r.StudentId == studentId &&
                        r.SubjectId == subjectId &&
                        r.ExamId == examId);

                if (existing == null)
                {
                    _context.StudentSubjectResults.Add(new StudentSubjectResult
                    {
                        StudentId = studentId,
                        SubjectId = subjectId,
                        ExamId = examId,
                        FinalPercentage = Math.Round(finalPercentage, 2),
                        GPA = calculatedGpa,
                        Grade = calculatedGrade
                    });
                }
                else
                {
                    existing.FinalPercentage = Math.Round(finalPercentage, 2);
                    existing.GPA = calculatedGpa;
                    existing.Grade = calculatedGrade;
                }
            }

            await _context.SaveChangesAsync();
        }

        //  GET MARKS BY SECTION 
        [HttpGet("marks/{sectionId}")]
        public async Task<IActionResult> GetMarksBySection(int sectionId)
        {
            var marks = await _context.StudentMarks
                .Where(m => m.SectionId == sectionId)
                .Select(m => new
                {
                    m.StudentId,
                    m.MarksObtained,
                    m.MaxMarks
                })
                .ToListAsync();

            return Ok(marks);
        }


        [HttpGet("dashboard")]
        public async Task<IActionResult> GetTeacherDashboard()
        {
            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // Get exams created by this teacher
            var exams = await _context.Exams
                .Where(e => e.CreatedBy == teacherId)
                .Select(e => e.Id)
                .ToListAsync();

            var totalExams = exams.Count;

            // Pending results (exams not published yet)
            var pendingResults = await _context.Exams
                .Where(e => e.CreatedBy == teacherId && e.Status != "Published")
                .CountAsync();

            if (!exams.Any())
            {
                return Ok(new
                {
                    totalExams = 0,
                    totalStudents = 0,
                    averageScore = 0,
                    atRiskCount = 0,
                    pendingResults = 0,
                    topStudents = new List<object>(),
                    atRiskStudents = new List<object>(),
                    subjectAverages = new List<object>(),
                    trend = new List<object>(),
                    weakAreas = new List<object>()
                });
            }

            // Get subject results for teacher exams
            var subjectResults = await _context.StudentSubjectResults
                .Where(r => exams.Contains(r.ExamId))
                .Include(r => r.Student)
                .Include(r => r.Subject)
                .Include(r => r.Exam)
                .ToListAsync();

            if (!subjectResults.Any())
            {
                return Ok(new
                {
                    totalExams,
                    totalStudents = 0,
                    averageScore = 0,
                    atRiskCount = 0,
                    pendingResults,
                    topStudents = new List<object>(),
                    atRiskStudents = new List<object>(),
                    subjectAverages = new List<object>(),
                    trend = new List<object>(),
                    weakAreas = new List<object>()
                });
            }

            // ================= STUDENT GROUPING =================
            var studentGroups = subjectResults
                .GroupBy(r => new { r.StudentId, r.Student!.FullName })
                .Select(g => new
                {
                    studentId = g.Key.StudentId,
                    studentName = g.Key.FullName,
                    overallPercentage = Math.Round(g.Average(x => x.FinalPercentage), 2)
                })
                .ToList();

            var totalStudents = studentGroups.Count;

            var averageScore = Math.Round(
                studentGroups.Average(s => s.overallPercentage), 2
            );

            // ================= AT-RISK COUNT =================
            var atRiskCount = subjectResults
                .GroupBy(r => r.StudentId)
                .Count(g => g.Any(x => x.FinalPercentage < 40));

            // ================= TOP STUDENTS =================
            var topStudents = studentGroups
                .OrderByDescending(s => s.overallPercentage)
                .Take(3)
                .ToList();

            // ================= AT-RISK STUDENTS TABLE =================
            var atRiskStudents = subjectResults
                .GroupBy(r => new { r.StudentId, r.Student!.FullName })
                .Select(g => new
                {
                    studentId = g.Key.StudentId,
                    studentName = g.Key.FullName,
                    lowestScore = g.Min(x => x.FinalPercentage),
                    overallPercentage = Math.Round(g.Average(x => x.FinalPercentage), 2)
                })
                .Where(s => s.lowestScore < 40)
                .OrderBy(s => s.lowestScore)
                .Take(5)
                .ToList();

            // ================= SUBJECT-WISE AVERAGE =================
            var subjectAverages = subjectResults
                .GroupBy(r => r.Subject!.Name)
                .Select(g => new
                {
                    subject = g.Key,
                    average = Math.Round(g.Average(x => x.FinalPercentage), 2)
                })
                .ToList();

            // ================= PERFORMANCE TREND =================
            var trend = subjectResults
                .GroupBy(r => r.Exam!.Name)
                .Select(g => new
                {
                    exam = g.Key,
                    average = Math.Round(g.Average(x => x.FinalPercentage), 2)
                })
                .ToList();

            // ================= WEAK AREA ANALYTICS =================
            var weakAreas = await _context.StudentMarks
                .Where(m => exams.Contains(m.ExamId))
                .Include(m => m.Section)
                .GroupBy(m => m.Section!.Name)
                .Select(g => new
                {
                    section = g.Key,
                    average = Math.Round(
                        g.Average(x => (x.MarksObtained / x.MaxMarks) * 100), 2)
                })
                .OrderBy(x => x.average)
                .ToListAsync();

            return Ok(new
            {
                totalExams,
                totalStudents,
                averageScore,
                atRiskCount,
                pendingResults,
                topStudents,
                atRiskStudents,
                subjectAverages,
                trend,
                weakAreas
            });
        }


        //  CREATE EXAM 
        [HttpPost("exam")]
        public async Task<IActionResult> CreateExam(CreateExamDto dto)
        {
            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var exam = new Exam
            {
                Name = dto.Name,
                AcademicYear = dto.AcademicYear,
                CreatedBy = teacherId,
                Status = "Draft"
            };

            _context.Exams.Add(exam);
            await _context.SaveChangesAsync();

            await _auditService.LogAsync(
                "Exam Created",
                $"ExamId: {exam.Id}, Name: {exam.Name}"
            );

            await NotifyAdmins(
                "Exam Created",
                $"Teacher created exam '{exam.Name}'",
                "Exam"
            );

            return Ok(new
            {
                exam.Id,
                exam.Name,
                exam.AcademicYear,
                exam.Status,
                exam.CreatedBy
            });
        }


        //  UPDATE EXAM 
        [HttpPut("exams/{examId}")]
        public async Task<IActionResult> UpdateExam(int examId, UpdateExamDto dto)
        {
            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var exam = await _context.Exams
                .FirstOrDefaultAsync(e => e.Id == examId && e.CreatedBy == teacherId);

            if (exam == null)
                return NotFound("Exam not found or access denied");

            exam.Name = dto.Name;
            exam.AcademicYear = dto.AcademicYear;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                exam.Id,
                exam.Name,
                exam.AcademicYear,
                exam.CreatedBy
            });
        }


        //  DELETE EXAM 
        [HttpDelete("exams/{examId}")]
        public async Task<IActionResult> DeleteExam(int examId)
        {
            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var exam = await _context.Exams
                .FirstOrDefaultAsync(e => e.Id == examId && e.CreatedBy == teacherId);

            if (exam == null)
                return NotFound("Exam not found or access denied");

            _context.Exams.Remove(exam);
            await _context.SaveChangesAsync();

            await _auditService.LogAsync(
                "Exam Deleted",
                $"ExamId: {exam.Id}, Name: {exam.Name}"
            );

            return Ok("Exam deleted successfully");
        }

        //  CREATE SUBJECT 
        [HttpPost("subject")]
        public async Task<IActionResult> CreateSubject(CreateSubjectDto dto)
        {
            if (!await _context.Exams.AnyAsync(e => e.Id == dto.ExamId))
                return BadRequest("Invalid ExamId");

            var subject = new Subject
            {
                Name = System.Globalization.CultureInfo.CurrentCulture.TextInfo
                    .ToTitleCase(dto.Name.Trim().ToLower()),
                ExamId = dto.ExamId
            };

            _context.Subjects.Add(subject);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                subject.Id,
                subject.Name,
                subject.ExamId
            });
        }

        // ==================== UPDATE SUBJECT ====================
        [HttpPut("subjects/{subjectId}")]
        public async Task<IActionResult> UpdateSubject(int subjectId, UpdateSubjectDto dto)
        {
            var subject = await _context.Subjects
                .Include(s => s.Exam)
                .FirstOrDefaultAsync(s => s.Id == subjectId);

            if (subject == null)
                return NotFound("Subject not found");

            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (subject.Exam!.CreatedBy != teacherId)
                return Unauthorized("Access denied");

            subject.Name = System.Globalization.CultureInfo.CurrentCulture.TextInfo
                .ToTitleCase(dto.Name.Trim().ToLower());
            await _context.SaveChangesAsync();

            return Ok(new
            {
                subject.Id,
                subject.Name,
                subject.ExamId
            });
        }

        //  GET SUBJECTS BY EXAM 
        [HttpGet("exams/{examId}/subjects")]
        public async Task<IActionResult> GetSubjectsByExam(int examId)
        {
            var subjects = await _context.Subjects
                .Where(s => s.ExamId == examId)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.ExamId
                })
                .ToListAsync();

            return Ok(subjects);
        }

        //  DELETE SUBJECT 
        [HttpDelete("subjects/{subjectId}")]
        public async Task<IActionResult> DeleteSubject(int subjectId)
        {
            var subject = await _context.Subjects.FindAsync(subjectId);
            if (subject == null)
                return NotFound("Subject not found");

            _context.Subjects.Remove(subject);
            await _context.SaveChangesAsync();

            return Ok();
        }

        //  CREATE SECTION 
        [HttpPost("section")]
        public async Task<IActionResult> CreateSection(CreateAssessmentSectionDto dto)
        {
            if (!await _context.Subjects.AnyAsync(s => s.Id == dto.SubjectId))
                return BadRequest("Invalid SubjectId");

            var totalWeightage = await _context.AssessmentSections
                .Where(s => s.SubjectId == dto.SubjectId)
                .SumAsync(s => s.Weightage);

            if (totalWeightage + dto.Weightage > 100)
                return BadRequest("Total weightage cannot exceed 100%");

            var section = new AssessmentSection
            {
                Name = dto.Name,
                Weightage = dto.Weightage,
                MaxMarks = dto.MaxMarks,
                SubjectId = dto.SubjectId
            };

            _context.AssessmentSections.Add(section);
            await _context.SaveChangesAsync();

            await _auditService.LogAsync(
                "Section Created",
                $"SectionId: {section.Id}, Name: {section.Name}"
            );

            return Ok(new
            {
                section.Id,
                section.Name,
                section.Weightage,
                section.MaxMarks,
                section.SubjectId
            });
        }

        //  UPDATE SECTION 
        [HttpPut("sections/{sectionId}")]
        public async Task<IActionResult> UpdateSection(int sectionId, UpdateAssessmentSectionDto dto)
        {
            var section = await _context.AssessmentSections
                .Include(s => s.Subject!)
                .ThenInclude(sub => sub.Exam!)
                .FirstOrDefaultAsync(s => s.Id == sectionId);

            if (section == null)
                return NotFound("Section not found");

            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (section.Subject!.Exam!.CreatedBy != teacherId)
                return Unauthorized("Access denied");

            var otherWeightage = await _context.AssessmentSections
                .Where(s => s.SubjectId == section.SubjectId && s.Id != sectionId)
                .SumAsync(s => s.Weightage);

            if (otherWeightage + dto.Weightage > 100)
                return BadRequest("Total weightage cannot exceed 100%");

            section.Name = dto.Name;
            section.Weightage = dto.Weightage;
            section.MaxMarks = dto.MaxMarks;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                section.Id,
                section.Name,
                section.Weightage,
                section.MaxMarks,
                section.SubjectId
            });
        }

        //  GET SECTIONS BY SUBJECT 
        [HttpGet("subjects/{subjectId}/sections")]
        public async Task<IActionResult> GetSectionsBySubject(int subjectId)
        {
            var sections = await _context.AssessmentSections
                .Where(s => s.SubjectId == subjectId)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Weightage,
                    s.MaxMarks,
                    s.SubjectId
                })
                .ToListAsync();

            return Ok(sections);
        }

        //  ADD STUDENT MARKS 
        [HttpPost("marks")]
        public async Task<IActionResult> AddStudentMarks(CreateStudentMarkDto dto)
        {
            var exists = await _context.StudentMarks.AnyAsync(sm =>
                sm.StudentId == dto.StudentId &&
                sm.SectionId == dto.SectionId &&
                sm.ExamId == dto.ExamId);

            if (exists)
                return BadRequest("Marks already entered");

            var mark = new StudentMark
            {
                StudentId = dto.StudentId,
                ExamId = dto.ExamId,
                SubjectId = dto.SubjectId,
                SectionId = dto.SectionId,
                MarksObtained = dto.MarksObtained,
                MaxMarks = dto.MaxMarks
            };

            _context.StudentMarks.Add(mark);
            await _context.SaveChangesAsync();

            // Recalculate subject results after inserting mark
            await RecalculateSubjectResults(dto.SubjectId, dto.ExamId);

            await _auditService.LogAsync(
                "Mark Entered",
                $"StudentId: {dto.StudentId}, Marks: {dto.MarksObtained}"
            );

            return Ok(mark);
        }


        //  GET STUDENTS 
        [HttpGet("students")]
        public async Task<IActionResult> GetStudents()
        {
            var students = await _context.Users
                .Where(u => u.Role == "Student")
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.PhotoUrl
                })
                .ToListAsync();

            return Ok(students);
        }


        // ================= GET SINGLE STUDENT PROFILE =================
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


        //  DELETE SECTION 
        [HttpDelete("sections/{sectionId}")]
        public async Task<IActionResult> DeleteSection(int sectionId)
        {
            var section = await _context.AssessmentSections
                .Include(s => s.Subject!)
                .ThenInclude(sub => sub.Exam!)
                .FirstOrDefaultAsync(s => s.Id == sectionId);

            if (section == null)
                return NotFound("Section not found");

            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            if (section.Subject!.Exam!.CreatedBy != teacherId)
                return Unauthorized("Access denied");

            var hasMarks = await _context.StudentMarks
                .AnyAsync(m => m.SectionId == sectionId);

            if (hasMarks)
                return BadRequest("Cannot delete section. Marks already entered.");

            _context.AssessmentSections.Remove(section);
            await _context.SaveChangesAsync();

            var userEmail = User.Identity?.Name ?? "Unknown";

            await _auditService.LogAsync(
                "Section Deleted",
                $"SectionId: {sectionId}, Subject: {section.Subject!.Name}"
            );

            return Ok("Section deleted successfully");
        }

        //  GET EXAMS 
        [HttpGet("exams")]
        public async Task<IActionResult> GetMyExams()
        {
            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var exams = await _context.Exams
                .Where(e => e.CreatedBy == teacherId)
                .Select(e => new
                {
                    e.Id,
                    e.Name,
                    e.AcademicYear,
                    e.Status,
                    e.CreatedAt
                })
                .ToListAsync();

            return Ok(exams);
        }


        //------------------------- publish exam--------------------------
        [HttpPut("exams/{examId}/publish")]
        public async Task<IActionResult> PublishExam(int examId)
        {
            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var exam = await _context.Exams
                .FirstOrDefaultAsync(e => e.Id == examId && e.CreatedBy == teacherId);

            if (exam == null)
                return NotFound("Exam not found or access denied");

            if (exam.Status == "Published")
                return BadRequest("Exam is already published.");

            var subjects = await _context.Subjects
                .Where(s => s.ExamId == examId)
                .ToListAsync();

            if (!subjects.Any())
                return BadRequest("Cannot publish. No subjects added.");

            foreach (var subject in subjects)
            {
                var sections = await _context.AssessmentSections
                    .Include(s => s.Subject)
                    .Where(s => s.SubjectId == subject.Id && s.Subject.ExamId == examId)
                    .ToListAsync();

                if (!sections.Any())
                    return BadRequest($"Subject '{subject.Name}' has no sections.");

                var totalWeight = sections.Sum(s => s.Weightage);

                if (totalWeight != 100)
                    return BadRequest($"Subject '{subject.Name}' weightage must equal 100%.");

                var marksCount = await _context.StudentMarks
                    .CountAsync(sm => sm.SubjectId == subject.Id && sm.ExamId == examId);

                if (marksCount == 0)
                    return BadRequest($"No marks entered for subject '{subject.Name}'.");

                var resultsCount = await _context.StudentSubjectResults
                    .CountAsync(r => r.SubjectId == subject.Id && r.ExamId == examId);

                if (resultsCount == 0)
                    return BadRequest($"Results not calculated for subject '{subject.Name}'.");
            }

            exam.Status = "Published";
            exam.PublishedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Get unique student IDs for this exam
            var studentIds = await _context.StudentSubjectResults
                .Where(r => r.ExamId == examId)
                .Select(r => r.StudentId)
                .Distinct()
                .ToListAsync();

            foreach (var studentId in studentIds)
            {
                // Check Exam Published already exists
                var examExists = await _context.Notifications.AnyAsync(n =>
                    n.UserId == studentId &&
                    n.Title == "Exam Published" &&
                    n.ReferenceId == exam.Id
                );

                if (!examExists)
                {
                    await _notificationService.CreateAsync(
                        studentId,
                        "Exam Published",
                        $"Your teacher has published {exam.Name}.",
                        "Exam",
                        "Student",
                        exam.Id,
                        "/student/results"
                    );
                }

                // Check Results Published already exists
                var resultExists = await _context.Notifications.AnyAsync(n =>
                    n.UserId == studentId &&
                    n.Title == "Results Published" &&
                    n.ReferenceId == exam.Id
                );

                if (!resultExists)
                {
                    await _notificationService.CreateAsync(
                        studentId,
                        "Results Published",
                        $"Your results for {exam.Name} are now available.",
                        "Grade",
                        "Student",
                        exam.Id,
                        "/student/results"
                    );
                }
            }

            await NotifyAdmins(
                "Exam Published by Teacher",
                $"Teacher has published exam '{exam.Name}'",
                "Exam"
            );

            await _auditService.LogAsync(
                "Exam Published",
                $"ExamId: {exam.Id}, Name: {exam.Name}"
            );

            return Ok("Exam published successfully.");
        }

        //----------------------unpublish------------------
        [HttpPut("exams/{examId}/unpublish")]
        public async Task<IActionResult> UnpublishExam(int examId)
        {
            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var exam = await _context.Exams
                .FirstOrDefaultAsync(e => e.Id == examId && e.CreatedBy == teacherId);

            if (exam == null)
                return NotFound("Exam not found or access denied");

            exam.Status = "Draft";
            exam.PublishedAt = null;

            await _context.SaveChangesAsync();

            await NotifyAdmins(
                "Exam Unpublished by Teacher",
                $"Teacher has unpublished exam '{exam.Name}'",
                "Warning"
            );

            var userEmail = User.Identity?.Name ?? "Unknown";

            await _auditService.LogAsync(
                "Exam Unpublished",
                $"ExamId: {exam.Id}, Name: {exam.Name}"
            );

            return Ok("Exam reverted to draft.");
        }



        // GET RESULTS
        [HttpGet("exams/{examId}/results")]
        public async Task<IActionResult> GetExamResults(int examId)
        {
            var exam = await _context.Exams
                .FirstOrDefaultAsync(e => e.Id == examId);

            if (exam == null)
                return NotFound("Exam not found.");

            var subjectResults = await _context.StudentSubjectResults
                .Where(r => r.ExamId == examId)
                .Include(r => r.Student)
                .Include(r => r.Subject)
                .ToListAsync();

            if (!subjectResults.Any())
                return Ok(new List<object>());

            var gradeScales = await _context.GradeScales
                .Where(g => g.IsActive)
                .OrderByDescending(g => g.MinPercentage)
                .ToListAsync();

            var grouped = subjectResults
                .GroupBy(r => new { r.StudentId, r.Student!.FullName })
                .Select(g =>
                {
                    var overallPercentage = g.Average(x => x.FinalPercentage);
                    var overallGpa = g.Average(x => x.GPA);

                    var matchedGrade = gradeScales
                        .FirstOrDefault(gs =>
                            overallPercentage >= (decimal)gs.MinPercentage &&
                            overallPercentage <= (decimal)gs.MaxPercentage);

                    return new
                    {
                        studentId = g.Key.StudentId,
                        studentName = g.Key.FullName,
                        subjects = g.Select(x => new
                        {
                            subjectId = x.SubjectId,
                            subjectName = x.Subject!.Name,
                            percentage = x.FinalPercentage,
                            gpa = x.GPA,
                            grade = x.Grade
                        }).ToList(),
                        overallPercentage = Math.Round(overallPercentage, 2),
                        overallGPA = Math.Round(overallGpa, 2),
                        overallGrade = matchedGrade?.GradeName ?? "N/A"
                    };
                })
                .OrderByDescending(x => x.overallPercentage)
                .ToList();

            return Ok(grouped);
        }


        // GET TOPPERS
        [HttpGet("exams/{examId}/toppers")]
        public async Task<IActionResult> GetToppers(int examId, [FromQuery] int count = 3)
        {
            var exam = await _context.Exams.FirstOrDefaultAsync(e => e.Id == examId);

            if (exam == null)
                return NotFound("Exam not found.");

            var subjectResults = await _context.StudentSubjectResults
                .Where(r => r.ExamId == examId)
                .Include(r => r.Student)
                .ToListAsync();

            if (!subjectResults.Any())
                return Ok(new List<object>());

            var gradeScales = await _context.GradeScales
                .Where(g => g.IsActive)
                .OrderByDescending(g => g.MinPercentage)
                .ToListAsync();

            var students = subjectResults
                .GroupBy(r => new { r.StudentId, r.Student!.FullName })
                .Select(g =>
                {
                    var overallPercentage = g.Average(x => x.FinalPercentage);
                    var overallGpa = g.Average(x => x.GPA);

                    var matchedGrade = gradeScales
                        .FirstOrDefault(gs =>
                            overallPercentage >= (decimal)gs.MinPercentage &&
                            overallPercentage <= (decimal)gs.MaxPercentage);

                    return new
                    {
                        studentId = g.Key.StudentId,
                        studentName = g.Key.FullName,
                        overallPercentage = Math.Round(overallPercentage, 2),
                        overallGPA = Math.Round(overallGpa, 2),
                        overallGrade = matchedGrade?.GradeName ?? "N/A"
                    };
                })
                .OrderByDescending(r => r.overallPercentage)
                .Take(count)
                .ToList();

            return Ok(students);
        }


        // GET AT-RISK STUDENTS
        [HttpGet("exams/{examId}/at-risk")]
        public async Task<IActionResult> GetAtRiskStudents(int examId, [FromQuery] decimal threshold = 40)
        {
            var exam = await _context.Exams.FirstOrDefaultAsync(e => e.Id == examId);

            if (exam == null)
                return NotFound("Exam not found.");

            var subjectResults = await _context.StudentSubjectResults
                .Where(r => r.ExamId == examId)
                .Include(r => r.Student)
                .ToListAsync();

            if (!subjectResults.Any())
                return Ok(new List<object>());

            var gradeScales = await _context.GradeScales
                .Where(g => g.IsActive)
                .OrderByDescending(g => g.MinPercentage)
                .ToListAsync();

            var students = subjectResults
                .GroupBy(r => new { r.StudentId, r.Student!.FullName })
                .Select(g =>
                {
                    var overallPercentage = g.Average(x => x.FinalPercentage);
                    var overallGpa = g.Average(x => x.GPA);

                    var matchedGrade = gradeScales
                        .FirstOrDefault(gs =>
                            overallPercentage >= (decimal)gs.MinPercentage &&
                            overallPercentage <= (decimal)gs.MaxPercentage);

                    return new
                    {
                        studentId = g.Key.StudentId,
                        studentName = g.Key.FullName,
                        overallPercentage = Math.Round(overallPercentage, 2),
                        overallGPA = Math.Round(overallGpa, 2),
                        overallGrade = matchedGrade?.GradeName ?? "N/A"
                    };
                })
                .Where(r => r.overallPercentage < threshold)
                .OrderBy(r => r.overallPercentage)
                .ToList();

            return Ok(students);
        }


        [HttpPost("marks/bulk")]
        public async Task<IActionResult> AddBulkMarks(List<CreateStudentMarkDto> dtos)
        {
            if (dtos == null || !dtos.Any())
                return BadRequest("No data received.");

            int inserted = 0;
            int skipped = 0;

            foreach (var dto in dtos)
            {
                var exists = await _context.StudentMarks.AnyAsync(sm =>
                    sm.StudentId == dto.StudentId &&
                    sm.SectionId == dto.SectionId &&
                    sm.ExamId == dto.ExamId);

                if (!exists)
                {
                    _context.StudentMarks.Add(new StudentMark
                    {
                        StudentId = dto.StudentId,
                        ExamId = dto.ExamId,
                        SubjectId = dto.SubjectId,
                        SectionId = dto.SectionId,
                        MarksObtained = dto.MarksObtained,
                        MaxMarks = dto.MaxMarks
                    });

                    inserted++;
                }
                else
                {
                    skipped++;
                }
            }

            await _context.SaveChangesAsync();

            // Recalculate results for affected subjects
            var subjectExamPairs = dtos
                .Select(d => new { d.SubjectId, d.ExamId })
                .Distinct()
                .ToList();

            foreach (var pair in subjectExamPairs)
            {
                await RecalculateSubjectResults(pair.SubjectId, pair.ExamId);
            }

            // Notification ONLY for bulk upload
            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            await _notificationService.CreateAsync(
                teacherId,
                "Bulk Upload Completed",
                $"Bulk upload successful. {inserted} inserted, {skipped} skipped.",
                "System",
                "Teacher",
                null,
                "/teacher/marks"
            );

            await _auditService.LogAsync(
                "Bulk Marks Upload",
                 $"Inserted: {inserted}, Skipped: {skipped}"
            );

            return Ok(new
            {
                inserted, skipped
          
            });
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetTeacherProfile()
        {
            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var teacher = await _context.Users
                .Where(u => u.Id == teacherId && u.Role == "Teacher")
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
                return NotFound("Teacher profile not found.");

            return Ok(teacher);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateTeacherProfile([FromBody] UpdateTeacherProfileDto dto)
        {
            Console.WriteLine(dto.FullName);
            Console.WriteLine(dto.Phone);
            Console.WriteLine(dto.Address);
            Console.WriteLine(dto.DateOfBirth);
            Console.WriteLine(dto.Gender);

            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var teacher = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == teacherId && u.Role == "Teacher");

            if (teacher == null)
                return NotFound("Teacher not found.");

            teacher.FullName = dto.FullName;
            teacher.Phone = dto.Phone;
            teacher.Address = dto.Address;
            teacher.DateOfBirth = dto.DateOfBirth;
            teacher.Gender = dto.Gender;

            await _context.SaveChangesAsync();

            return Ok("Profile updated successfully.");
        }


        [HttpPost("profile/photo")]
        public async Task<IActionResult> UploadTeacherPhoto(IFormFile photo)
        {
            if (photo == null || photo.Length == 0)
                return BadRequest("No file uploaded.");

            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var teacher = await _context.Users.FirstOrDefaultAsync(u => u.Id == teacherId);

            if (teacher == null)
                return NotFound("Teacher not found.");

            var uploadsFolder = Path.Combine("wwwroot", "uploads");

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}_{photo.FileName}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await photo.CopyToAsync(stream);
            }

            teacher.PhotoUrl = $"/uploads/{fileName}";

            await _context.SaveChangesAsync();

            return Ok(new { photoUrl = teacher.PhotoUrl });
        }


        // ================= STUDENT SUBJECT INSIGHTS =================
        [HttpGet("students/{id}/insights")]
        public async Task<IActionResult> GetStudentInsights(int id)
        {
            var student = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id && u.Role == "Student");

            if (student == null)
                return NotFound("Student not found");

            var insights = await _context.StudentSubjectResults
                .Where(r => r.StudentId == id)
                .Include(r => r.Subject)
                .Select(r => new
                {
                    subject = r.Subject!.Name,
                    marks = Math.Round(r.FinalPercentage, 2),
                    grade = r.Grade,
                    gpa = r.GPA
                })
                .ToListAsync();

            return Ok(insights);
        }


        [HttpGet("exams/{examId}/export-pdf")]
        public async Task<IActionResult> ExportExamResultsPdf(int examId)
        {
            try
            {
                var exam = await _context.Exams
                    .FirstOrDefaultAsync(e => e.Id == examId);

                if (exam == null)
                    return NotFound("Exam not found.");

                if (exam.Status != "Published")
                    return BadRequest("Exam is not published before exporting PDF.");

                var subjectResults = await _context.StudentSubjectResults
                    .Where(r => r.ExamId == examId)
                    .Include(r => r.Student)
                    .ToListAsync();

                if (!subjectResults.Any())
                    return BadRequest(new { message = "No results available for this exam." });

                // load grade scales BEFORE using
                var gradeScales = await _context.GradeScales
                    .Where(g => g.IsActive)
                    .OrderByDescending(g => g.MinPercentage)
                    .ToListAsync();

                var grouped = subjectResults
                    .GroupBy(r => new { r.StudentId, r.Student!.FullName })
                    .Select(g =>
                    {
                        var percentage = g.Average(x => x.FinalPercentage);

                        var matchedGrade = gradeScales.FirstOrDefault(gs =>
                            percentage >= (decimal)gs.MinPercentage &&
                            percentage <= (decimal)gs.MaxPercentage);

                        return new
                        {
                            studentName = g.Key.FullName,
                            percentage = Math.Round(percentage, 2),
                            gpa = Math.Round(g.Average(x => x.GPA), 2),
                            grade = matchedGrade?.GradeName ?? "N/A"
                        };
                    })
                    .OrderByDescending(x => x.percentage)
                    .ToList();

                decimal classAverage = Math.Round(grouped.Average(x => x.percentage), 2);
                decimal highestScore = grouped.Max(x => x.percentage);

                QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

                var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "SGlogo.png");

                var document = QuestPDF.Fluent.Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(QuestPDF.Helpers.PageSizes.A4);
                        page.Margin(30);

                        page.Header().Background("#1F2A37").PaddingVertical(20).PaddingHorizontal(25).Column(header =>
                        {
                            header.Spacing(10);

                            header.Item().Row(row =>
                            {
                                row.Spacing(15);

                                row.ConstantItem(70).Height(70).Image(logoPath);

                                row.RelativeItem().Column(c =>
                                {
                                    c.Spacing(5);

                                    c.Item().Text("SMARTGRADE INTERNATIONAL SCHOOL")
                                        .FontSize(20)
                                        .FontColor(Colors.White)
                                        .Bold();

                                    c.Item().Text("Exam Results Report")
                                        .FontSize(12)
                                        .FontColor(Colors.Grey.Lighten1);
                                });
                            });

                            header.Item().PaddingTop(10).LineHorizontal(3).LineColor(Colors.Yellow.Medium);
                        });

                        page.Content().PaddingTop(15).Column(col =>
                        {
                            col.Spacing(15);

                            col.Item().Background(Colors.Grey.Lighten3).Padding(10).Column(c =>
                            {
                                c.Item().Text($"Total Students: {grouped.Count}");
                                c.Item().Text($"Average: {classAverage}%");
                                c.Item().Text($"Highest: {highestScore}%");
                                c.Item().Text($"Pass Rate: 100%");
                            });

                            col.Item().Text("Student Rankings")
                                .FontSize(16)
                                .Bold();

                            col.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.ConstantColumn(50);
                                    columns.RelativeColumn(3);
                                    columns.RelativeColumn(2);
                                    columns.RelativeColumn(2);
                                    columns.RelativeColumn(2);
                                });

                                table.Header(header =>
                                {
                                    header.Cell().Background("#1F2A37").Padding(6).Text("Rank").FontColor(Colors.White);
                                    header.Cell().Background("#1F2A37").Padding(6).Text("Student").FontColor(Colors.White);
                                    header.Cell().Background("#1F2A37").Padding(6).Text("%").FontColor(Colors.White);
                                    header.Cell().Background("#1F2A37").Padding(6).Text("GPA").FontColor(Colors.White);
                                    header.Cell().Background("#1F2A37").Padding(6).Text("Grade").FontColor(Colors.White);
                                });

                                int rank = 1;

                                foreach (var s in grouped)
                                {
                                    table.Cell().Padding(5).Text(rank.ToString());
                                    table.Cell().Padding(5).Text(s.studentName);
                                    table.Cell().Padding(5).Text($"{s.percentage}%");
                                    table.Cell().Padding(5).Text(s.gpa.ToString());
                                    table.Cell().Padding(5).Text(s.grade);

                                    rank++;
                                }
                            });

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
                });

                var pdfBytes = document.GeneratePdf();

                return File(
                    pdfBytes,
                    "application/pdf",
                    $"Exam_{examId}_Results.pdf"
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine("PDF ERROR: " + ex.Message);

                return StatusCode(500, new
                {
                    message = "Failed to generate PDF",
                    error = ex.Message
                });
            }
        }

        [HttpGet("exams/{examId}/status")]
        public async Task<IActionResult> GetExamStatus(int examId)
        {
            var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var exam = await _context.Exams
                .FirstOrDefaultAsync(e => e.Id == examId && e.CreatedBy == teacherId);

            if (exam == null)
                return NotFound("Exam not found");

            return Ok(new { status = exam.Status });
        }



        [HttpGet("students/{id}/full-profile")]
        public async Task<IActionResult> GetFullStudentProfile(int id)
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
                    u.Gender,
                    u.GuardianName,
                    u.PhotoUrl
                })
                .FirstOrDefaultAsync();

            if (student == null)
                return NotFound("Student not found");

            var subjects = await _context.StudentSubjectResults
                .Where(r => r.StudentId == id)
                .Include(r => r.Subject)
                .Include(r => r.Exam)
                .Select(r => new
                {
                    subject = r.Subject!.Name,
                    percentage = r.FinalPercentage,
                    examName = r.Exam!.Name
                })
                .ToListAsync();

            var average = subjects.Any()
                ? Math.Round(subjects.Average(s => s.percentage), 2)
                : 0;

            var strongSubjects = subjects
                .Where(s => s.percentage >= 75)
                .Select(s => s.subject)
                .Distinct()
                .ToList();

            var weakSubjects = subjects
                .Where(s => s.percentage < 40)
                .Select(s => s.subject)
                .Distinct()
                .ToList();

            return Ok(new
            {
                student,
                subjects,
                strongSubjects,
                weakSubjects,
                average,
                consistency = "Stable"
            });
        }

        private async Task NotifyAdmins(string title, string message, string type)
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
