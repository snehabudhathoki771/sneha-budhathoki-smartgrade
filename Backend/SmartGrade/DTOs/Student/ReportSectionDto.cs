namespace SmartGrade.DTOs.Student
{
    public class ReportSectionDto
    {
        public string SectionName { get; set; } = string.Empty;
        public double MarksObtained { get; set; }
        public double MaxMarks { get; set; }
        public double Percentage { get; set; }
    }
}
