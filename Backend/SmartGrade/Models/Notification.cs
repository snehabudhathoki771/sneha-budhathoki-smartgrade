using System.ComponentModel.DataAnnotations.Schema;

namespace SmartGrade.Models
{
    [Table("Notifications")]
    public class Notification
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        public User User { get; set; } = null!;

        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("message")]
        public string Message { get; set; } = string.Empty;

        [Column("type")]
        public string Type { get; set; } = string.Empty; // Grade, Warning, System

        [Column("is_read")]
        public bool IsRead { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("reference_id")]
        public int? ReferenceId { get; set; }

        [Column("route")]
        public string? Route { get; set; }

        [Column("target_role")]
        public string? TargetRole { get; set; } // Admin, Teacher, Student
    }
}