using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartGrade.Data;
using SmartGrade.DTOs.Student;
using SmartGrade.Services;
using System.Security.Claims;

namespace SmartGrade.Controllers
{
    [ApiController]
    [Route("api/student")]
    [Authorize(Roles = "Student")]
    public class StudentController : ControllerBase
    {
        private readonly StudentDashboardService _dashboardService;
        private readonly ReportCardService _reportCardService;
        private readonly AppDbContext _context;

        private readonly ILogger<StudentController> _logger;

        public StudentController(
            StudentDashboardService dashboardService,
            ReportCardService reportCardService,
            AppDbContext context,
            ILogger<StudentController> logger)
        {
            _dashboardService = dashboardService;
            _reportCardService = reportCardService;
            _context = context;
            _logger = logger;
        }


        // ================= HELPER =================

        private int? GetStudentId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
                return null;

            if (!int.TryParse(userId, out int studentId))
                return null;

            return studentId;
        }

        // ================= DASHBOARD =================

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var studentId = GetStudentId();

            if (studentId == null)
                return Unauthorized("Invalid token.");

            var result = await _dashboardService.GetDashboardAsync(studentId.Value.ToString());

            return Ok(result);
        }

        // ================= RESULTS =================

        [HttpGet("results")]
        public async Task<IActionResult> GetResults()
        {
            var studentId = GetStudentId();

            if (studentId == null)
                return Unauthorized("Invalid token.");

            var results = await _dashboardService.GetResultsAsync(studentId.Value.ToString());

            return Ok(results);
        }

        // ================= ANALYTICS =================

        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics()
        {
            var studentId = GetStudentId();

            if (studentId == null)
                return Unauthorized("Invalid token.");

            var analytics = await _dashboardService.GetAnalyticsAsync(studentId.Value.ToString());

            return Ok(analytics);
        }

        // ================= PROFILE =================

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var studentId = GetStudentId();

            if (studentId == null)
                return Unauthorized("Invalid token.");

            var profile = await _dashboardService.GetProfileAsync(studentId.Value.ToString());

            return Ok(profile);
        }

        // ================= REPORT SUMMARY =================

        [HttpGet("report-summary")]
        public async Task<IActionResult> GetReportSummary()
        {
            var studentId = GetStudentId();

            if (studentId == null)
                return Unauthorized("Invalid token.");

            var report = await _dashboardService.GetReportSummaryAsync(studentId.Value.ToString());

            return Ok(report);
        }

        // ================= REPORT PDF =================

        [HttpGet("report/{examId}")]
        public async Task<IActionResult> DownloadReport(int examId)
        {
            var studentId = GetStudentId();

            if (studentId == null)
                return Unauthorized("Invalid token.");

            try
            {
                var reportBytes = await _reportCardService
                    .GenerateReportByIdAsync(studentId.Value, examId);

                return File(
                    reportBytes,
                    "application/pdf",
                    $"Exam_{examId}_Report.pdf");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ================= STUDENT FEEDBACK =================

        [HttpGet("feedback")]
        public async Task<IActionResult> GetFeedback()
        {
            var studentId = GetStudentId();

            if (studentId == null)
                return Unauthorized("Invalid token.");

            var feedback = await _context.Feedbacks
                .Where(f => f.StudentId == studentId.Value)
                .Include(f => f.Exam)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new
                {
                    f.Id,
                    examName = f.Exam != null ? f.Exam.Name : "",
                    f.Subject,
                    f.Rating,
                    f.Message,
                    f.CreatedAt
                })
                .ToListAsync();

            return Ok(feedback);
        }

        // ================= PROFILE =================

        [HttpPut("profile")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateProfile([FromForm] UpdateStudentProfileDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int studentId))
                return Unauthorized("Invalid token.");

            var student = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == studentId && u.Role == "Student");

            if (student == null)
                return NotFound("Student not found.");

            // Update fields
            if (!string.IsNullOrWhiteSpace(dto.FullName))
                student.FullName = dto.FullName;

            student.Phone = dto.Phone;
            student.Address = dto.Address;
            student.Gender = dto.Gender;
            student.GuardianName = dto.GuardianName;
            student.GuardianPhone = dto.GuardianPhone;

            if (dto.DateOfBirth.HasValue)
                student.DateOfBirth = dto.DateOfBirth.Value;

            // Photo upload
            if (dto.Photo != null && dto.Photo.Length > 0)
            {
                var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

                if (!Directory.Exists(uploadFolder))
                    Directory.CreateDirectory(uploadFolder);

                var fileName = Guid.NewGuid() + Path.GetExtension(dto.Photo.FileName);
                var filePath = Path.Combine(uploadFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.Photo.CopyToAsync(stream);
                }

                student.PhotoUrl = "/uploads/" + fileName;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating student profile");
                return StatusCode(500, "An unexpected error occurred while updating the profile.");
            }

            return Ok(new
            {
                message = "Profile updated successfully",
                photoUrl = student.PhotoUrl
            });
        }



        // ================= UPLOAD PROFILE PHOTO =================

        [HttpPost("profile/photo")]
        public async Task<IActionResult> UploadPhoto(IFormFile file)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(userId, out int studentId))
                return Unauthorized();

            var student = await _context.Users.FindAsync(studentId);

            if (student == null)
                return NotFound();

            if (file == null || file.Length == 0)
                return BadRequest("Invalid file.");

            var folder = Path.Combine("wwwroot", "profile-images");

            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var path = Path.Combine(folder, fileName);

            using (var stream = new FileStream(path, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            student.PhotoUrl = $"/profile-images/{fileName}";
            
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating student profile");
                return StatusCode(500, "Internal server error: " + ex.Message);
            }


            return Ok(new { photoUrl = student.PhotoUrl });
        }
    }
}