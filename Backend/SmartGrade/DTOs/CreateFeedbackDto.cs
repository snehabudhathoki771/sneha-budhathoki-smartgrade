namespace SmartGrade.DTOs
{
    public class CreateFeedbackDto
    {
        public int StudentId { get; set; }
        public int ExamId { get; set; }
        public string? Subject { get; set; }
        public string? Message { get; set; }
        public int? Rating { get; set; }
    }
}
