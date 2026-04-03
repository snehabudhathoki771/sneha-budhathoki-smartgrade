using Microsoft.AspNetCore.Http;

namespace SmartGrade.DTOs.Student
{
    public class UpdateStudentProfileDto
    {
        public string? FullName { get; set; }

        public string? Phone { get; set; }

        public string? Address { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public string? Gender { get; set; }

        public string? GuardianName { get; set; }

        public string? GuardianPhone { get; set; }

        public IFormFile? Photo { get; set; }
    }
}