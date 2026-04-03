using System.ComponentModel.DataAnnotations;

namespace SmartGrade.Models
{
    public class AssessmentSection
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = null!;

        [Range(1, 100)]
        public decimal Weightage { get; set; }

        [Range(1, 1000)]
        public int MaxMarks { get; set; }

        public int SubjectId { get; set; }

        public Subject Subject { get; set; } = null!;
    }
}
