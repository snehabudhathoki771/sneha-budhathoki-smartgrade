using Microsoft.AspNetCore.Http;

namespace SmartGrade.DTOs.Marks
{
    public class BulkUploadRequestDto
    {
        public IFormFile File { get; set; } = null!;
        public int SectionId { get; set; }
    }
}
