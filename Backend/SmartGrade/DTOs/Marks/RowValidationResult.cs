namespace SmartGrade.DTOs.Marks
{
    public class RowValidationResult
    {
        public string StudentEmail { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public bool IsValid { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
    }


}
