namespace SmartGrade.DTOs.Student
{
    public class StudentDashboardDto
    {
        public string FullName { get; set; } = string.Empty;
        public double GPA { get; set; }
        public double? PreviousGPA { get; set; }
        public double? GpaDifference { get; set; }
        public double Percentage { get; set; }
        public string Status { get; set; } = string.Empty;
        public int TotalExams { get; set; }
        public List<WeakSubjectDto> WeakSubjects { get; set; } = new();
        public List<string> StrongSubjects { get; set; } = new();
        public List<PerformanceTrendDto> PerformanceTrend { get; set; } = new();
    }
}
