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

                // handle empty or null report
                if (reportBytes == null || reportBytes.Length == 0)
                {
                    return NotFound("Report not available for this exam.");
                }

                return File(
                    reportBytes,
                    "application/pdf",
                    $"Exam_{examId}_Report.pdf");
            }
            catch (Exception ex)
            {
                // differentiate error types
                if (ex.Message.Contains("No data found"))
                {
                    return NotFound(ex.Message);
                }

                return StatusCode(500, "An error occurred while generating the report.");
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
            // ===== GET USER ID =====
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int studentId))
                return Unauthorized("Invalid token.");

            Console.WriteLine("Updating DB user ID: " + studentId);

            var student = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == studentId && u.Role == "Student");

            if (student == null)
                return NotFound("Student not found.");

            // ================= UPDATE TEXT FIELDS =================

            if (!string.IsNullOrWhiteSpace(dto.FullName))
                student.FullName = dto.FullName;

            student.Phone = dto.Phone ?? student.Phone;
            student.Address = dto.Address ?? student.Address;
            student.Gender = dto.Gender ?? student.Gender;
            student.GuardianName = dto.GuardianName ?? student.GuardianName;
            student.GuardianPhone = dto.GuardianPhone ?? student.GuardianPhone;

            if (dto.DateOfBirth.HasValue)
            {
                student.DateOfBirth = DateTime.SpecifyKind(
                    dto.DateOfBirth.Value,
                    DateTimeKind.Utc
                );
            }

            // ================= PHOTO (STORE IN DB) =================

            if (dto.Photo != null && dto.Photo.Length > 0)
            {
                // Validate file type
                if (!dto.Photo.ContentType.StartsWith("image/"))
                    return BadRequest("Only image files are allowed.");

                // Validate file size (2MB)
                if (dto.Photo.Length > 2 * 1024 * 1024)
                    return BadRequest("File size must be less than 2MB.");

                using var memoryStream = new MemoryStream();
                await dto.Photo.CopyToAsync(memoryStream);

                student.ProfileImage = memoryStream.ToArray();
                student.ProfileImageContentType = dto.Photo.ContentType;

                Console.WriteLine("Image stored in DB");
            }
            else
            {
                Console.WriteLine("No photo received from frontend");
            }

            // ================= SAVE TO DATABASE =================

            try
            {
                await _context.SaveChangesAsync();
                Console.WriteLine("Changes saved to database successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating student profile");
                return StatusCode(500, "An unexpected error occurred while updating the profile.");
            }

            // ================= RESPONSE =================

            return Ok(new
            {
                message = "Profile updated successfully",
                photoUrl = $"/api/student/profile-image/{student.Id}"
            });
        }

        [AllowAnonymous]
        [HttpGet("profile-image/{id}")]
        public async Task<IActionResult> GetProfileImage(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null || user.ProfileImage == null)
                return NotFound();

            return File(user.ProfileImage, user.ProfileImageContentType ?? "image/jpeg");
        }
    }
}