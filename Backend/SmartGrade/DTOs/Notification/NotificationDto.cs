namespace SmartGrade.DTOs.Notification
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public int? ReferenceId { get; set; }
        public string? Route { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}