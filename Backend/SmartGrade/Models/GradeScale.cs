using System;

namespace SmartGrade.Models
{
    public class GradeScale
    {
        public int Id { get; set; }

        public string GradeName { get; set; }

        public double MinPercentage { get; set; }
        public double MaxPercentage { get; set; }

        public double GpaValue { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}