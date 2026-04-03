using Microsoft.EntityFrameworkCore;
using SmartGrade.Data;
using SmartGrade.DTOs.Student;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace SmartGrade.Services
{
    public class StudentDashboardService
    {
        private readonly AppDbContext _context;
        private readonly NotificationService _notificationService;

        public StudentDashboardService(
            AppDbContext context,
            NotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // ================= DASHBOARD =================

        public async Task<StudentDashboardDto> GetDashboardAsync(string userId)
        {
            if (!int.TryParse(userId, out int studentId))
                throw new Exception("Invalid user ID.");

            var student = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == studentId && u.Role == "Student");

            if (student == null)
                throw new Exception("Student not found.");

            var marks = await _context.StudentMarks
                .Include(m => m.Subject)
                .Where(m => m.StudentId == studentId
                    && m.Exam.Status == "Published")
                .ToListAsync();

            if (!marks.Any())
            {
                return new StudentDashboardDto
                {
                    FullName = student.FullName,
                    GPA = 0,
                    PreviousGPA = null,
                    GpaDifference = null,
                    Percentage = 0,
                    Status = "No Data",
                    TotalExams = 0,
                    WeakSubjects = new List<WeakSubjectDto>()
                };
            }

            // ================= OVERALL CALCULATION =================

            decimal totalObtained = marks.Sum(m => m.MarksObtained);
            decimal totalMax = marks.Sum(m => m.MaxMarks);

            decimal percentage = totalMax > 0
                ? (totalObtained / totalMax) * 100
                : 0;

            double gpa = totalMax > 0
                ? (double)(percentage / 25)
                : 0;

            // ================= EXAM COUNT =================

            int totalExams = marks
                .Select(m => m.ExamId)
                .Distinct()
                .Count();

            // ================= GPA TREND =================

            var examGroups = marks
                .GroupBy(m => m.ExamId)
                .OrderBy(g => g.Key)
                .ToList();

            double? previousGpa = null;
            double? gpaDifference = null;

            if (examGroups.Count > 1)
            {
                var previousExam = examGroups[examGroups.Count - 2];

                decimal prevObtained = previousExam.Sum(x => x.MarksObtained);
                decimal prevMax = previousExam.Sum(x => x.MaxMarks);

                if (prevMax > 0)
                {
                    decimal prevPercentage = (prevObtained / prevMax) * 100;
                    previousGpa = (double)(prevPercentage / 25);

                    gpaDifference = gpa - previousGpa;
                }
            }

            // ================= WEAK SUBJECT DETECTION =================

            var weakSubjects = marks
                .GroupBy(m => m.Subject.Name)
                .Select(g =>
                {
                    decimal subjectTotal = g.Sum(x => x.MaxMarks);
                    decimal subjectObtained = g.Sum(x => x.MarksObtained);

                    decimal subjectPercentage = subjectTotal > 0
                        ? (subjectObtained / subjectTotal) * 100
                        : 0;

                    return new
                    {
                        SubjectName = g.Key,
                        Percentage = subjectPercentage
                    };
                })
                .Where(s => s.Percentage < 40)
                .Select(s => new WeakSubjectDto
                {
                    Name = s.SubjectName,
                    Percentage = Math.Round((double)s.Percentage, 2)
                })
                .ToList();

            // ================= STATUS CLASSIFICATION =================

            string status;

            if (percentage >= 85)
                status = "Topper";
            else if (percentage < 50)
                status = "At Risk";
            else
                status = "Normal";

            // ================= RETURN DTO =================

            return new StudentDashboardDto
            {
                FullName = student.FullName,
                GPA = Math.Round(gpa, 2),
                PreviousGPA = previousGpa.HasValue ? Math.Round(previousGpa.Value, 2) : null,
                GpaDifference = gpaDifference.HasValue ? Math.Round(gpaDifference.Value, 2) : null,
                Percentage = Math.Round((double)percentage, 2),
                Status = status,
                TotalExams = totalExams,
                WeakSubjects = weakSubjects
            };
        }

        // ================= RESULTS =================

        public async Task<List<StudentExamResultDto>> GetResultsAsync(string userId)
        {
            if (!int.TryParse(userId, out int studentId))
                throw new Exception("Invalid user ID.");

            var marks = await _context.StudentMarks
                .Include(m => m.Exam)
                .Include(m => m.Subject)
                .Include(m => m.Section)
                .Where(m => m.StudentId == studentId
                    && m.Exam != null
                    && m.Exam.Status == "Published")
                .ToListAsync();

            var result = marks
                .GroupBy(m => new { m.ExamId, m.Exam.Name })
                .Select(examGroup => new StudentExamResultDto
                {
                    ExamId = examGroup.Key.ExamId,
                    ExamName = examGroup.Key.Name,

                    Subjects = examGroup
                        .GroupBy(m => m.Subject.Name)
                        .Select(subjectGroup => new StudentSubjectResultDto
                        {
                            SubjectName = subjectGroup.Key,

                            Sections = subjectGroup
                                .Select(m => new StudentSectionResultDto
                                {
                                    SectionName = m.Section?.Name ?? "N/A",
                                    MarksObtained = m.MarksObtained,
                                    MaxMarks = m.MaxMarks,
                                    Percentage = m.MaxMarks > 0
                                        ? Math.Round((double)((m.MarksObtained / m.MaxMarks) * 100), 2)
                                        : 0
                                })
                                .ToList()
                        })
                        .ToList()
                })
                .ToList();

            return result;
        }

        // ================= ANALYTICS =================

        public async Task<StudentAnalyticsDto> GetAnalyticsAsync(string userId)
        {
            if (!int.TryParse(userId, out int studentId))
                throw new Exception("Invalid user ID.");

            var marks = await _context.StudentMarks
                .Include(m => m.Subject)
                .Include(m => m.Section)
                .Where(m => m.StudentId == studentId
                    && m.Exam.Status == "Published")
                .ToListAsync();

            if (!marks.Any())
                return new StudentAnalyticsDto();

            decimal totalObtained = marks.Sum(m => m.MarksObtained);
            decimal totalMax = marks.Sum(m => m.MaxMarks);

            double averagePercentage = totalMax > 0
                ? Math.Round((double)((totalObtained / totalMax) * 100), 2)
                : 0;

            var weakSubjects = marks
                .GroupBy(m => m.Subject.Name)
                .Where(g =>
                {
                    decimal subjectTotal = g.Sum(x => x.MaxMarks);
                    if (subjectTotal == 0) return false;

                    decimal subjectObtained = g.Sum(x => x.MarksObtained);
                    return ((subjectObtained / subjectTotal) * 100) < 40;
                })
                .Select(g => g.Key)
                .ToList();

            var strongSubjects = marks
                .GroupBy(m => m.Subject.Name)
                .Where(g =>
                {
                    decimal subjectTotal = g.Sum(x => x.MaxMarks);
                    if (subjectTotal == 0) return false;

                    decimal subjectObtained = g.Sum(x => x.MarksObtained);
                    return ((subjectObtained / subjectTotal) * 100) >= 75;
                })
                .Select(g => g.Key)
                .ToList();

            var weakSections = marks
                .GroupBy(m => m.Section.Name)
                .Where(g =>
                {
                    decimal sectionTotal = g.Sum(x => x.MaxMarks);
                    if (sectionTotal == 0) return false;

                    decimal sectionObtained = g.Sum(x => x.MarksObtained);
                    return ((sectionObtained / sectionTotal) * 100) < 40;
                })
                .Select(g => g.Key)
                .ToList();

            string insight = "Keep improving your performance.";

            if (weakSubjects.Any())
                insight = $"Focus more on {string.Join(", ", weakSubjects)}.";

            if (weakSections.Any())
                insight += $" Improve your {string.Join(", ", weakSections)} skills.";

            return new StudentAnalyticsDto
            {
                WeakSubjects = weakSubjects,
                StrongSubjects = strongSubjects,
                WeakSections = weakSections,
                AveragePercentage = averagePercentage,
                Insight = insight
            };
        }

        // ================= PROFILE =================

        public async Task<StudentProfileDto> GetProfileAsync(string userId)
        {
            if (!int.TryParse(userId, out int studentId))
                throw new Exception("Invalid user ID.");

            var student = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == studentId && u.Role == "Student");

            if (student == null)
                throw new Exception("Student not found.");

            var marks = await _context.StudentMarks
                .Where(m => m.StudentId == studentId
                    && m.Exam.Status == "Published")
                .ToListAsync();

            decimal totalObtained = marks.Sum(m => m.MarksObtained);
            decimal totalMax = marks.Sum(m => m.MaxMarks);

            decimal percentage = totalMax > 0
                ? (totalObtained / totalMax) * 100
                : 0;

            double gpa = totalMax > 0
                ? (double)(percentage / 25)
                : 0;

            return new StudentProfileDto
            {
                FullName = student.FullName,
                Email = student.Email,
                PhotoUrl = student.PhotoUrl,

                Phone = student.Phone,
                Address = student.Address,
                DateOfBirth = student.DateOfBirth,
                Gender = student.Gender,
                GuardianName = student.GuardianName,
                GuardianPhone = student.GuardianPhone,

                TotalExams = marks.Select(m => m.ExamId).Distinct().Count(),
                OverallPercentage = Math.Round((double)percentage, 2),
                GPA = Math.Round(gpa, 2)
            };
        }

        // ================= REPORT SUMMARY =================

        public async Task<StudentReportSummaryDto> GetReportSummaryAsync(string userId)
        {
            var dashboard = await GetDashboardAsync(userId);

            return new StudentReportSummaryDto
            {
                FullName = dashboard.FullName,
                GPA = dashboard.GPA,
                Percentage = dashboard.Percentage,
                Status = dashboard.Status,
                WeakSubjects = dashboard.WeakSubjects
            };
        }

        // ================= PDF REPORT =================

        public async Task<byte[]> GenerateReportAsync(string userId, string examName)
        {
            if (!int.TryParse(userId, out int studentId))
                throw new Exception("Invalid user ID.");

            var student = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == studentId && u.Role == "Student");

            if (student == null)
                throw new Exception("Student not found.");

            // Load ONLY published exam marks
            var allMarks = await _context.StudentMarks
                .Include(m => m.Subject)
                .Include(m => m.Section)
                .Include(m => m.Exam)
                .Where(m =>
                    m.StudentId == studentId &&
                    m.Exam != null &&
                    m.Exam.Status == "Published")
                .ToListAsync();

            // Filter requested exam
            var marks = allMarks
                .Where(m =>
                    string.Equals(
                        m.Exam.Name?.Trim(),
                        examName?.Trim(),
                        StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (!marks.Any())
            {
                var availableExams = allMarks
                    .Select(m => m.Exam?.Name)
                    .Distinct()
                    .ToList();

                throw new Exception(
                    "No published exam data found. Available exams: " +
                    string.Join(" | ", availableExams));
            }

            decimal totalObtained = marks.Sum(m => m.MarksObtained);
            decimal totalMax = marks.Sum(m => m.MaxMarks);

            decimal percentage = totalMax > 0
                ? (totalObtained / totalMax) * 100
                : 0;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(30);

                    page.Content().Column(col =>
                    {
                        col.Spacing(5);

                        col.Item().Text("SMARTGRADE")
                            .FontSize(20)
                            .Bold();

                        col.Item().Text($"Exam Report: {examName}")
                            .FontSize(16)
                            .Bold();

                        col.Item().Text($"Student: {student.FullName ?? "N/A"}");
                        col.Item().Text($"Email: {student.Email ?? "N/A"}");
                        col.Item().Text($"Generated: {DateTime.Now:dd MMM yyyy}");

                        col.Item().LineHorizontal(1);

                        foreach (var mark in marks)
                        {
                            var subjectName = mark.Subject?.Name ?? "N/A";
                            var sectionName = mark.Section?.Name ?? "N/A";

                            col.Item().Text(
                                $"{subjectName} - {sectionName}: {mark.MarksObtained}/{mark.MaxMarks}"
                            );
                        }

                        col.Item().LineHorizontal(1);

                        col.Item().Text($"Total: {totalObtained}/{totalMax}")
                            .Bold();

                        col.Item().Text($"Percentage: {Math.Round(percentage, 2)}%");
                    });
                });
            });

            return document.GeneratePdf();
        }

        public async Task<byte[]> GenerateReportByIdAsync(string userId, int examId)
        {
            if (!int.TryParse(userId, out int studentId))
                throw new Exception("Invalid user ID.");

            var student = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == studentId && u.Role == "Student");

            if (student == null)
                throw new Exception("Student not found.");

            var marks = await _context.StudentMarks
                .Include(m => m.Subject)
                .Include(m => m.Section)
                .Include(m => m.Exam)
                .Where(m => m.StudentId == studentId && m.ExamId == examId)
                .ToListAsync();

            if (!marks.Any())
                throw new Exception("No data found for this exam.");

            decimal totalObtained = marks.Sum(m => m.MarksObtained);
            decimal totalMax = marks.Sum(m => m.MaxMarks);
            decimal percentage = totalMax > 0
                ? (totalObtained / totalMax) * 100
                : 0;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(30);

                    page.Content().Column(col =>
                    {
                        col.Spacing(5);

                        col.Item().Text("SMARTGRADE")
                            .FontSize(20)
                            .Bold();

                        col.Item().Text($"Exam Report")
                            .FontSize(16)
                            .Bold();

                        col.Item().Text($"Student: {student.FullName ?? "N/A"}");
                        col.Item().Text($"Email: {student.Email ?? "N/A"}");
                        col.Item().Text($"Generated: {DateTime.Now:dd MMM yyyy}");

                        col.Item().LineHorizontal(1);

                        foreach (var mark in marks)
                        {
                            var subjectName = mark.Subject?.Name ?? "N/A";
                            var sectionName = mark.Section?.Name ?? "N/A";

                            col.Item().Text(
                                $"{subjectName} - {sectionName}: {mark.MarksObtained}/{mark.MaxMarks}"
                            );
                        }

                        col.Item().LineHorizontal(1);

                        col.Item().Text($"Total: {totalObtained}/{totalMax}")
                            .Bold();

                        col.Item().Text($"Percentage: {Math.Round(percentage, 2)}%");
                    });
                });
            });

            return document.GeneratePdf();
        }
    }
}