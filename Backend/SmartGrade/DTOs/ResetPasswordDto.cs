using System.ComponentModel.DataAnnotations;

namespace SmartGrade.DTOs
{
    public class ResetPasswordDto
    {
        [Required]
        public string Token { get; set; } = null!;

        [Required]
        public string NewPassword { get; set; } = null!;
    }
}
