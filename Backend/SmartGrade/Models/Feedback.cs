using System;

namespace SmartGrade.Models
{
    public class Feedback
    {
        public int Id { get; set; }

        public int TeacherId { get; set; }
        public int StudentId { get; set; }
        public int ExamId { get; set; }

        public string? Subject { get; set; }
        public string Message { get; set; } = string.Empty;
        public int? Rating { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties (MAKE NULLABLE)
        public User? Teacher { get; set; }
        public User? Student { get; set; }
        public Exam? Exam { get; set; }
    }
}
