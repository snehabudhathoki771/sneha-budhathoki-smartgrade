using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SmartGrade.Data;
using SmartGrade.DTOs.Student;

namespace SmartGrade.Services
{
    public class ReportCardService
    {
        private readonly AppDbContext _context;

        public ReportCardService(AppDbContext context)
        {
            _context = context;
        }

        // ================= BUILD REPORT DATA =================

        public async Task<StudentReportCardDto> BuildReportDataAsync(int studentId, int examId)
        {
            var student = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == studentId && u.Role == "Student");

            if (student == null)
                throw new Exception("Student not found.");

            var exam = await _context.Exams
                .FirstOrDefaultAsync(e => e.Id == examId);

            if (exam == null)
                throw new Exception("Exam not found.");

            var marks = await _context.StudentMarks
                .Include(m => m.Subject)
                .Include(m => m.Section)
                .Where(m => m.StudentId == studentId && m.ExamId == examId)
                .ToListAsync();

            if (!marks.Any())
                throw new Exception("No data found for this exam.");

            var subjects = marks
                .GroupBy(m => m.Subject != null ? m.Subject.Name : "Unknown Subject")
                .Select(g =>
                {
                    var sections = g.Select(m => new ReportSectionDto
                    {
                        SectionName = m.Section != null ? m.Section.Name : "N/A",
                        MarksObtained = (double)m.MarksObtained,
                        MaxMarks = (double)m.MaxMarks,
                        Percentage = m.MaxMarks > 0
                            ? Math.Round((double)m.MarksObtained / (double)m.MaxMarks * 100, 2)
                            : 0
                    }).ToList();

                    double totalObtained = sections.Sum(s => s.MarksObtained);
                    double totalMax = sections.Sum(s => s.MaxMarks);
                    double percentage = totalMax > 0
                        ? (totalObtained / totalMax) * 100
                        : 0;

                    return new ReportSubjectDto
                    {
                        SubjectName = g.Key,
                        TotalObtained = totalObtained,
                        TotalMax = totalMax,
                        Percentage = Math.Round(percentage, 2),
                        Sections = sections
                    };
                }).ToList();

            double overallObtained = subjects.Sum(s => s.TotalObtained);
            double overallMax = subjects.Sum(s => s.TotalMax);
            double overallPercentage = overallMax > 0
                ? (overallObtained / overallMax) * 100
                : 0;

            double gpa = overallPercentage / 25;

            string status =
                overallPercentage >= 85 ? "Topper" :
                overallPercentage < 50 ? "At Risk" :
                "Normal";

            return new StudentReportCardDto
            {
                StudentName = student.FullName,
                ExamName = exam.Name,
                GeneratedDate = DateTime.UtcNow,
                OverallPercentage = Math.Round(overallPercentage, 2),
                GPA = Math.Round(gpa, 2),
                Status = status,
                Subjects = subjects
            };
        }

        // ================= GENERATE PDF =================

        public async Task<byte[]> GenerateReportByIdAsync(int studentId, int examId)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            StudentReportCardDto reportData;

            try
            {
                reportData = await BuildReportDataAsync(studentId, examId);
            }
            catch
            {
                return Array.Empty<byte>();
            }

            var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "SGlogo.png");

            byte[] logoBytes = null;

            if (File.Exists(logoPath))
                logoBytes = await File.ReadAllBytesAsync(logoPath);

            var signPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "adminSign.png");

            byte[] signBytes = null;

            if (File.Exists(signPath))
                signBytes = await File.ReadAllBytesAsync(signPath);

            string gradeLetter = GetGradeLetter(reportData.OverallPercentage);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(40);

                    page.Header().Background("#1F2A37").Padding(15).Row(row =>
                    {
                        if (logoBytes != null)
                            row.ConstantItem(80).Height(60).Image(logoBytes);

                        row.RelativeItem().Column(column =>
                        {
                            column.Item().Text("SMARTGRADE INTERNATIONAL SCHOOL")
                                .FontSize(18)
                                .FontColor(Colors.White)
                                .Bold();

                            column.Item().Text("Official Academic Report Card")
                                .FontSize(11)
                                .FontColor(Colors.Grey.Lighten2);

                            column.Item().PaddingTop(5).LineHorizontal(1).LineColor(Colors.Yellow.Medium);
                        });
                    });

                    page.Content().PaddingVertical(20).Column(column =>
                    {
                        column.Spacing(15);

                        column.Item().Background(Colors.Grey.Lighten3).Padding(10).Column(col =>
                        {
                            col.Item().Text($"Student Name: {reportData.StudentName}")
                                .FontSize(12);

                            col.Item().Text($"Examination: {reportData.ExamName}")
                                .FontSize(12);

                            col.Item().Text($"Generated Date: {reportData.GeneratedDate:dd MMM yyyy}")
                                .FontSize(12);
                        });

                        column.Item().PaddingTop(10).Text("Subject Performance")
                            .FontSize(16)
                            .Bold();

                        column.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background("#1F2A37").Padding(5).Text("Subject").FontColor(Colors.White);
                                header.Cell().Background("#1F2A37").Padding(5).Text("Obtained").FontColor(Colors.White);
                                header.Cell().Background("#1F2A37").Padding(5).Text("Total").FontColor(Colors.White);
                                header.Cell().Background("#1F2A37").Padding(5).Text("Percentage").FontColor(Colors.White);
                            });

                            foreach (var subject in reportData.Subjects)
                            {
                                table.Cell().Padding(5).Text(subject.SubjectName);
                                table.Cell().Padding(5).Text(subject.TotalObtained.ToString());
                                table.Cell().Padding(5).Text(subject.TotalMax.ToString());
                                table.Cell().Padding(5).Text($"{subject.Percentage}%");
                            }

                            static IContainer HeaderStyle(IContainer container)
                            {
                                return container
                                    .Padding(5)
                                    .Background(Colors.Grey.Lighten3)
                                    .BorderBottom(1)
                                    .BorderColor(Colors.Grey.Medium);
                            }

                            static IContainer CellStyle(IContainer container)
                            {
                                return container
                                    .Padding(5)
                                    .BorderBottom(1)
                                    .BorderColor(Colors.Grey.Lighten2);
                            }
                        });

                        column.Item().PaddingTop(20).LineHorizontal(1);

                        column.Item().Row(row =>
                        {
                            row.RelativeItem().Background(Colors.Grey.Lighten3).Padding(10).Column(col =>
                            {
                                col.Item().Text("Overall Summary")
                                    .FontSize(14)
                                    .Bold();

                                col.Item().Text($"Overall Percentage: {reportData.OverallPercentage}%");
                                col.Item().Text($"GPA: {reportData.GPA}");
                                col.Item().Text($"Grade: {gradeLetter}");
                                col.Item().Text($"Status: {reportData.Status}");
                            });

                            row.RelativeItem().Background("#E8F5E9").Padding(10).Column(col =>
                            {
                                col.Item().Text("Performance Insight")
                                    .FontSize(14)
                                    .Bold();

                                col.Item().Text(GetPerformanceInsight(reportData.Status));
                            });
                        });

                        column.Item().PaddingTop(30).Row(row =>
                        {
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text("-------------------");
                                col.Item().Text("Class Teacher Signature");
                            });

                            row.RelativeItem().AlignRight().Column(col =>
                            {
                                col.Item().AlignCenter().Height(50).Image(signBytes ?? Array.Empty<byte>());

                                col.Item().AlignCenter().Width(150).LineHorizontal(1);

                                col.Item().AlignCenter().Text("Principal Signature");
                            });
                        });
                    });

                    page.Footer()
                        .AlignCenter()
                        .Text("This is a system-generated report. No physical signature required.")
                        .FontSize(10);
                });
            });

            var pdfBytes = document.GeneratePdf();

            if (pdfBytes == null || pdfBytes.Length == 0)
                return Array.Empty<byte>();

            return pdfBytes;
        }



        private string GetGradeLetter(double percentage)
        {
            if (percentage >= 90) return "A+";
            if (percentage >= 80) return "A";
            if (percentage >= 70) return "B";
            if (percentage >= 60) return "C";
            if (percentage >= 50) return "D";
            return "F";
        }
        private string GetPerformanceInsight(string status)
        {
            if (status == "Topper")
                return "Excellent academic performance. Keep maintaining consistency and aim for continued excellence.";
            if (status == "At Risk")
                return "Performance needs improvement. Focus on weak subjects and seek guidance where necessary.";
            return "Overall performance is satisfactory. Continue working steadily to improve further.";
        }
    }
}