namespace SmartGrade.DTOs.AssessmentSection
{
    public class CreateAssessmentSectionDto
    {
        public string Name { get; set; } = null!;
        public decimal Weightage { get; set; }
        public int MaxMarks { get; set; }
        public int SubjectId { get; set; }
    }
}
