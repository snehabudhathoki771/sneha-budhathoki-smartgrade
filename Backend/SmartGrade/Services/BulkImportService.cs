using Microsoft.EntityFrameworkCore;
using SmartGrade.Data;
using SmartGrade.DTOs.Marks;
using SmartGrade.Models;

namespace SmartGrade.Services
{
    public class BulkImportService
    {
        private readonly AppDbContext _context;

        public BulkImportService(AppDbContext context)
        {
            _context = context;
        }

        // ============================================
        // VALIDATE CSV ROWS BEFORE INSERTING
        // ============================================
        public async Task<BulkUploadResultDto> ValidateAsync(
            List<BulkStudentMarkDto> rows,
            int sectionId)
        {
            var result = new BulkUploadResultDto
            {
                TotalRows = rows.Count
            };

            var section = await _context.AssessmentSections
                .Include(s => s.Subject)
                .FirstOrDefaultAsync(s => s.Id == sectionId);

            if (section == null)
                return result;

            foreach (var row in rows)
            {
                var validation = new RowValidationResult
                {
                    StudentEmail = row.StudentEmail ?? string.Empty,

                    Score = row.Score
                };

                var student = await _context.Users
                    .FirstOrDefaultAsync(u =>
                        u.Email == row.StudentEmail &&
                        u.Role == "Student");

                if (student == null)
                {
                    validation.IsValid = false;
                    validation.ErrorMessage = "Student not found.";
                }
                else if (row.Score < 0 || row.Score > section.MaxMarks)
                {
                    validation.IsValid = false;
                    validation.ErrorMessage = "Invalid marks range.";
                }
                else if (await _context.StudentMarks.AnyAsync(sm =>
                    sm.StudentId == student.Id &&
                    sm.SectionId == sectionId))
                {
                    validation.IsValid = false;
                    validation.ErrorMessage = "Marks already exist for this student.";
                }
                else
                {
                    validation.IsValid = true;
                    result.SuccessfulRows++;
                }

                if (!validation.IsValid)
                    result.FailedRows++;

                result.RowResults.Add(validation);
            }

            return result;
        }

        // ============================================
        // SAVE VALID ROWS INTO DATABASE
        // ============================================
        public async Task SaveAsync(
            List<RowValidationResult> rows,
            int sectionId)
        {
            var section = await _context.AssessmentSections
                .Include(s => s.Subject)
                .FirstOrDefaultAsync(s => s.Id == sectionId);

            if (section == null || section.Subject == null)
                return;

            foreach (var row in rows.Where(r => r.IsValid))
            {
                var student = await _context.Users
                    .FirstOrDefaultAsync(u =>
                        u.Email == row.StudentEmail &&
                        u.Role == "Student");

                if (student == null)
                    continue;

                var mark = new StudentMark
                {
                    StudentId = student.Id,
                    ExamId = section.Subject.ExamId,
                    SubjectId = section.SubjectId,
                    SectionId = sectionId,
                    MarksObtained = row.Score,
                    MaxMarks = section.MaxMarks
                };

                _context.StudentMarks.Add(mark);
            }

            await _context.SaveChangesAsync();
        }
    }
}
