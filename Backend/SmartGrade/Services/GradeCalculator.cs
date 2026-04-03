using SmartGrade.Models;

namespace SmartGrade.Services
{
    public class GradeCalculator
    {
        public (string grade, decimal gpa) CalculateFromList(
            decimal percentage,
            List<GradeScale> gradeScales)
        {
            var gradeScale = gradeScales
                .OrderByDescending(g => g.MinPercentage)
                .FirstOrDefault(g =>
                    percentage >= (decimal)g.MinPercentage &&
                    percentage <= (decimal)g.MaxPercentage);

            if (gradeScale == null)
                return ("N/A", 0);

            return (gradeScale.GradeName, (decimal)gradeScale.GpaValue);
        }
    }
}