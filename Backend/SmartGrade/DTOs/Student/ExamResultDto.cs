namespace SmartGrade.DTOs.Student
{
    public class ExamResultDto
    {
        public int TotalStudents { get; set; }
        public double ClassAverage { get; set; }
        public double HighestScore { get; set; }
        public double PassRate { get; set; }

        public List<StudentResultDto> Students { get; set; } = new();
    }

    public class StudentResultDto
    {
        public string Name { get; set; } = string.Empty;
        public double Percentage { get; set; }
        public double GPA { get; set; }
        public string Grade { get; set; } = string.Empty;
    }
}