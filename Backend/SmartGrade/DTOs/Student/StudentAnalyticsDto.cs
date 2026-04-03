namespace SmartGrade.DTOs.Student
{
    public class StudentAnalyticsDto
    {
        public List<string> WeakSubjects { get; set; } = new();
        public List<string> StrongSubjects { get; set; } = new();
        public List<string> WeakSections { get; set; } = new();
        public double AveragePercentage { get; set; }
        public string Insight { get; set; } = string.Empty;
    }
}