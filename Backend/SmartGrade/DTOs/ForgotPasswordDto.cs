using System.ComponentModel.DataAnnotations;

namespace SmartGrade.DTOs
{
    public class ForgotPasswordDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = null!;
    }
}
