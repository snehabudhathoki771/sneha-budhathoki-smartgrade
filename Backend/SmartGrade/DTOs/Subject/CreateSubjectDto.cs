namespace SmartGrade.DTOs.Subject
{
    public class CreateSubjectDto
    {
        public string Name { get; set; } = null!;
        public int ExamId { get; set; }
    }
}
