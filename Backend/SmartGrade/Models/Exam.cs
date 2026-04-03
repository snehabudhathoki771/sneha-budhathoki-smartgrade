using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartGrade.Models
{
    public class Exam
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = null!;

        [Required]
        public string AcademicYear { get; set; } = null!;

        [Required]
        public string Status { get; set; } = "Draft";

        public int CreatedBy { get; set; }

        [ForeignKey("CreatedBy")]
        public User Teacher { get; set; } = null!;


        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? PublishedAt { get; set; }

        public ICollection<Subject> Subjects { get; set; } = new List<Subject>();

    }
}

