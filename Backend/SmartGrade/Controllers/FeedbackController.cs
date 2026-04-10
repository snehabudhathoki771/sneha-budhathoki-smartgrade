using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartGrade.Data;
using SmartGrade.DTOs;
using SmartGrade.Models;
using SmartGrade.Services;
using System.Security.Claims;


namespace SmartGrade.Controllers
{
    [ApiController]
    [Route("api/teacher/feedback")]
    [Authorize(Roles = "Teacher")]
    public class FeedbackController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly NotificationService _notificationService;

        public FeedbackController(AppDbContext context, NotificationService notificationService )
        {
            _context = context;
            _notificationService = notificationService;
        }

        //  GET ALL FEEDBACK 

        [HttpGet]
        public async Task<IActionResult> GetAllFeedback()
        {
            var teacherId = int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!
            );

            var feedback = await _context.Feedbacks
                .Where(f => f.TeacherId == teacherId)
                .Include(f => f.Student)
                .Include(f => f.Exam)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new
                {
                    f.Id,
                    studentName = f.Student != null ? f.Student.FullName : "",
                    examName = f.Exam != null ? f.Exam.Name : "",
                    f.Subject,
                    f.Rating,
                    f.Message,
                    f.CreatedAt
                })
                .ToListAsync();

            return Ok(feedback);
        }

        //  CREATE FEEDBACK 

        [HttpPost]
        public async Task<IActionResult> CreateFeedback([FromBody] CreateFeedbackDto dto)
        {
            if (dto == null ||
                dto.StudentId <= 0 ||
                dto.ExamId <= 0 ||
                string.IsNullOrWhiteSpace(dto.Message))
            {
                return BadRequest("Invalid feedback data.");
            }

            var teacherId = int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!
            );

            var feedback = new Feedback
            {
                TeacherId = teacherId,
                StudentId = dto.StudentId,
                ExamId = dto.ExamId,
                Subject = dto.Subject,
                Rating = dto.Rating,
                Message = dto.Message.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            // ================= NOTIFY STUDENT =================

            var exam = await _context.Exams
                .FirstOrDefaultAsync(e => e.Id == dto.ExamId);

            await _notificationService.CreateAsync(
                dto.StudentId,
                "Feedback Received",
                $"Your teacher has given feedback for {exam?.Name}.",
                "Grade",
                "Student",
                dto.ExamId,
                "/student/feedback"
            );

            return Ok(new { message = "Feedback created successfully." });
        }

        //  DELETE FEEDBACK 

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFeedback(int id)
        {
            var teacherId = int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!
            );

            var feedback = await _context.Feedbacks
                .FirstOrDefaultAsync(f => f.Id == id && f.TeacherId == teacherId);

            if (feedback == null)
                return NotFound("Feedback not found.");

            _context.Feedbacks.Remove(feedback);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Feedback deleted successfully." });
        }
    }
}
