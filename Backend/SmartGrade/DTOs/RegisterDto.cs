using System.ComponentModel.DataAnnotations;

namespace SmartGrade.DTOs
{
    public class RegisterDto
    {
        [Required]
        public required string FullName { get; set; } = null!;

        [Required, EmailAddress]
        public required string Email { get; set; } = null!;

        [Required]
        public required string Password { get; set; } = null!;

        [Required]
        public string Role { get; set; } = "Student";
    }
}
