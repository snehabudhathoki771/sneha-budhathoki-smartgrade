namespace SmartGrade.DTOs.Student
{
    public class StudentSubjectResultDto
    {
        public string SubjectName { get; set; } = string.Empty;
        public List<StudentSectionResultDto> Sections { get; set; } = new();
    }
}
