namespace SmartGrade.DTOs.Marks
{
    public class BulkUploadResultDto
    {
        public int TotalRows { get; set; }
        public int SuccessfulRows { get; set; }
        public int FailedRows { get; set; }

        public List<RowValidationResult> RowResults { get; set; } = new();
    }

}
