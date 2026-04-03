using Microsoft.EntityFrameworkCore;
using SmartGrade.Data;
using SmartGrade.Models;

namespace SmartGrade.Services
{
    public class AnalyticsService
    {
        private readonly AppDbContext _context;

        public AnalyticsService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<object>> GetSubjectAnalyticsAsync(int subjectId)
        {
            var sections = await _context.AssessmentSections
                .Where(s => s.SubjectId == subjectId)
                .ToListAsync();

            if (!sections.Any())
                return new List<object>();

            var students = await _context.StudentMarks
                .Where(m => m.SubjectId == subjectId)
                .Select(m => m.StudentId)
                .Distinct()
                .ToListAsync();

            var analytics = new List<object>();

            foreach (var studentId in students)
            {
                var student = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == studentId);

                if (student == null)
                    continue;

                var breakdown = new List<object>();
                decimal lowestPercentage = 101;
                string weakestSection = "";

                foreach (var section in sections)
                {
                    var mark = await _context.StudentMarks
                        .FirstOrDefaultAsync(m =>
                            m.StudentId == studentId &&
                            m.SectionId == section.Id);

                    if (mark == null || mark.MaxMarks == 0)
                        continue;

                    decimal percentage =
                        (mark.MarksObtained / mark.MaxMarks) * 100;

                    if (percentage < lowestPercentage)
                    {
                        lowestPercentage = percentage;
                        weakestSection = section.Name;
                    }

                    breakdown.Add(new
                    {
                        section = section.Name,
                        percentage = Math.Round(percentage, 2)
                    });
                }

                var suggestion = GenerateAutoSuggestion(weakestSection, lowestPercentage);

                analytics.Add(new
                {
                    studentId,
                    studentName = student.FullName,
                    weakestSection,
                    lowestPercentage = Math.Round(lowestPercentage, 2),
                    suggestion,
                    sectionBreakdown = breakdown
                });
            }

            return analytics;
        }

        private string GenerateAutoSuggestion(string sectionName, decimal percentage)
        {
            if (percentage >= 60)
                return "Performance is satisfactory. Encourage consistent practice.";

            if (string.IsNullOrEmpty(sectionName))
                return "No sufficient data to generate suggestion.";

            sectionName = sectionName.ToLower();

            if (sectionName.Contains("mcq"))
                return "Weak in objective questions. Recommend practice tests and time management drills.";

            if (sectionName.Contains("theory"))
                return "Theory understanding needs improvement. Suggest concept revision and structured answer writing.";

            if (sectionName.Contains("practical"))
                return "Practical skills are weak. Encourage hands-on exercises and lab practice.";

            if (sectionName.Contains("coding"))
                return "Coding performance is low. Recommend algorithm practice and debugging exercises.";

            return "Performance below expected level. Provide targeted academic support.";
        }
    }
}
