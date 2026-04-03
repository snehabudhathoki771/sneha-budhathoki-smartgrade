using System.ComponentModel.DataAnnotations;

namespace SmartGrade.Models
{
    public class AuditLog
    {
        public int Id { get; set; }

        [Required]
        public string Action { get; set; } = string.Empty;

        [Required]
        public string PerformedBy { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; }

        public string Details { get; set; } = string.Empty;
    }
}