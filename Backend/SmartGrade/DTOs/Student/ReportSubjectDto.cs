namespace SmartGrade.DTOs.Student
{
    public class ReportSubjectDto
    {
        public string SubjectName { get; set; } = string.Empty;
        public double TotalObtained { get; set; }
        public double TotalMax { get; set; }
        public double Percentage { get; set; }

        public List<ReportSectionDto> Sections { get; set; } = new();
    }
}
