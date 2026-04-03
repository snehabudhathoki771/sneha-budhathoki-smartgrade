using SmartGrade.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartGrade.Models
{
    public class StudentSubjectResult
    {
        public int Id { get; set; }

        public int StudentId { get; set; }
        public int ExamId { get; set; }
        public int SubjectId { get; set; }

        public decimal FinalPercentage { get; set; }
        public decimal GPA { get; set; }

        [Required]
        public string Grade { get; set; } = string.Empty;

        public User? Student { get; set; }
        public Exam? Exam { get; set; }
        public Subject? Subject { get; set; }
    }
}
