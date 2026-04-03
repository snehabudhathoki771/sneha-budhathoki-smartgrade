namespace SmartGrade.DTOs.Student
{
    public class StudentReportSummaryDto
    {
        public string FullName { get; set; } = string.Empty;
        public double GPA { get; set; }
        public double Percentage { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<WeakSubjectDto> WeakSubjects { get; set; } = new();
    }
}