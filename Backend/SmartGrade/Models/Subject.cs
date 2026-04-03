using SmartGrade.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartGrade.Models
{
    public class Subject
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = null!;

        public int ExamId { get; set; }

        [ForeignKey("ExamId")]
        public Exam Exam { get; set; } = null!;

        public ICollection<AssessmentSection> Sections { get; set; } = new List<AssessmentSection>();
    }
}
