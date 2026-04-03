namespace SmartGrade.DTOs.Student
{
    public class StudentSectionResultDto
    {
        public string SectionName { get; set; } = string.Empty;
        public decimal MarksObtained { get; set; }
        public decimal MaxMarks { get; set; }
        public double Percentage { get; set; }
    }
}
