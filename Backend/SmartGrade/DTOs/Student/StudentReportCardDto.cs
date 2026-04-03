namespace SmartGrade.DTOs.Student
{
    public class StudentReportCardDto
    {
        public string StudentName { get; set; } = string.Empty;
        public string ExamName { get; set; } = string.Empty;
        public DateTime GeneratedDate { get; set; }

        public double OverallPercentage { get; set; }
        public double GPA { get; set; }
        public string Status { get; set; } = string.Empty;

        public List<ReportSubjectDto> Subjects { get; set; } = new();
    }
}
