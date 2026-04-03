namespace SmartGrade.DTOs.Admin
{
    public class UpdateGradeDto
    {
        public string GradeName { get; set; }
        public double MinPercentage { get; set; }
        public double MaxPercentage { get; set; }
        public double GpaValue { get; set; }
        public bool IsActive { get; set; }
    }
}
