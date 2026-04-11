using System.ComponentModel.DataAnnotations.Schema;

namespace SmartGrade.Models
{
    [Table("users")]
    public class User
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("fullname")]
        public string FullName { get; set; } = null!;

        [Column("email")]
        public string Email { get; set; } = null!;

        [Column("passwordhash")]
        public string PasswordHash { get; set; } = null!;

        [Column("role")]
        public string Role { get; set; } = "Student";

        [Column("reset_token")]
        public string? ResetToken { get; set; }

        [Column("reset_token_expiry")]
        public DateTime? ResetTokenExpiry { get; set; }

        [Column("refresh_token")]
        public string? RefreshToken { get; set; }

        [Column("refresh_token_expiry_time")]
        public DateTime? RefreshTokenExpiryTime { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("deactivated_until")]
        public DateTime? DeactivatedUntil { get; set; }


        // ================= STUDENT PROFILE FIELDS =================

        [Column("photourl")]
        public string? PhotoUrl { get; set; }

        [Column("phone")]
        public string? Phone { get; set; }

        [Column("address")]
        public string? Address { get; set; }

        [Column("date_of_birth")]
        public DateTime? DateOfBirth { get; set; }

        [Column("gender")]
        public string? Gender { get; set; }

        [Column("guardian_name")]
        public string? GuardianName { get; set; }

        [Column("guardian_phone")]
        public string? GuardianPhone { get; set; }

        [Column("photodata")]
        public byte[]? PhotoData { get; set; }

        [Column("phototype")]
        public string? PhotoType { get; set; }
    }
}