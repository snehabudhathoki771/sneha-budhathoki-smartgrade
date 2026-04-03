namespace SmartGrade.DTOs.AssessmentSection
{
    public class UpdateAssessmentSectionDto
    {
        public string Name { get; set; } = string.Empty;
        public decimal Weightage { get; set; }
        public int MaxMarks { get; set; }
    }
}
