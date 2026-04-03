using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartGrade.Data;

namespace SmartGrade.Controllers
{
    [Route("api/admin/overview")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminOverviewController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminOverviewController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetOverview()
        {
            var totalStudents = await _context.Users
                .CountAsync(u => u.Role == "Student");

            var totalExams = await _context.Exams.CountAsync();

            var results = await _context.StudentSubjectResults
                .Include(r => r.Subject)
                .Include(r => r.Exam)
                .Include(r => r.Student)
                .ToListAsync();

            if (!results.Any())
            {
                return Ok(new
                {
                    totalStudents,
                    totalExams,
                    totalAtRisk = 0,
                    systemAverage = 0,
                    subjectFailureRanking = new List<object>(),
                    teacherPerformance = new List<object>()
                });
            }

            var systemAverage = Math.Round(
                results.Average(r => r.FinalPercentage), 2
            );

            var totalAtRisk = results
                .GroupBy(r => r.StudentId)
                .Count(g => g.Average(x => x.FinalPercentage) < 40);

            var subjectFailureRanking = results
                .GroupBy(r => r.Subject!.Name)
                .Select(g => new
                {
                    subject = g.Key,
                    failureRate = Math.Round(
                        g.Count(x => x.FinalPercentage < 40) * 100.0 / g.Count(), 2)
                })
                .OrderByDescending(x => x.failureRate)
                .ToList();

            var teacherPerformance = results
                .GroupBy(r => r.Exam!.CreatedBy)
                .Select(g => new
                {
                    teacherId = g.Key,
                    averageScore = Math.Round(
                        g.Average(x => x.FinalPercentage), 2)
                })
                .OrderByDescending(x => x.averageScore)
                .ToList();

            return Ok(new
            {
                totalStudents,
                totalExams,
                totalAtRisk,
                systemAverage,
                subjectFailureRanking,
                teacherPerformance
            });
        }
    }
}