using SmartGrade.Models;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartGrade.Models
{
    [Table("StudentMarks")]
    public class StudentMark
    {
        [Column("id")]
        public int Id { get; set; }

        // Student (User)
        [Column("student_id")]
        public int StudentId { get; set; }
        public User Student { get; set; } = null!;

        // Exam
        [Column("exam_id")]
        public int ExamId { get; set; }
        public Exam Exam { get; set; } = null!;

        // Subject
        [Column("subject_id")]
        public int SubjectId { get; set; }
        public Subject Subject { get; set; } = null!;

        // Assessment Section 
        [Column("section_id")]
        public int SectionId { get; set; }
        public AssessmentSection Section { get; set; } = null!;

        // Marks
        [Column("marks_obtained")]
        public decimal MarksObtained { get; set; }

        [Column("max_marks")]
        public decimal MaxMarks { get; set; }
    }
}
