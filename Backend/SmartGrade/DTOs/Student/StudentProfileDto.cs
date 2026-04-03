namespace SmartGrade.DTOs.Student
{
    public class StudentProfileDto
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhotoUrl { get; set; }

        public string? Phone { get; set; }
        public string? Address { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? GuardianName { get; set; }
        public string? GuardianPhone { get; set; }

        public int TotalExams { get; set; }
        public double OverallPercentage { get; set; }
        public double GPA { get; set; }
    }
}