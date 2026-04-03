namespace SmartGrade.DTOs.Student
{
    public class StudentExamResultDto
    {
        public int ExamId { get; set; }
        public string ExamName { get; set; } = string.Empty;
        public List<StudentSubjectResultDto> Subjects { get; set; } = new();
    }
}
