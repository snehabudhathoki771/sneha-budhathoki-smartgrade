namespace SmartGrade.DTOs
{
    public class TeacherDashboardDto
    {
        public int TotalExams { get; set; }
        public int TotalStudents { get; set; }
        public double AverageScore { get; set; }
        public int AtRiskCount { get; set; }

        public List<TopStudentDto> TopStudents { get; set; } = new();

        public List<SubjectAverageDto> SubjectAverages { get; set; } = new();
        public List<TrendDto> Trend { get; set; } = new();
    }

    public class SubjectAverageDto
    {
        public string Subject { get; set; } = string.Empty;
        public double Average { get; set; }
    }

    public class TrendDto
    {
        public string Exam { get; set; } = string.Empty;
        public double Average { get; set; }
    }

    public class TopStudentDto
    {
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public double OverallPercentage { get; set; } 
    }
}
