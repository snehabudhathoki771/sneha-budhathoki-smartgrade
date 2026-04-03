namespace SmartGrade.DTOs.Marks
{
    public class CreateStudentMarkDto
    {
        public int StudentId { get; set; }
        public int ExamId { get; set; }
        public int SubjectId { get; set; }
        public int SectionId { get; set; }

        public decimal MarksObtained { get; set; }
        public decimal MaxMarks { get; set; }
    }
}
