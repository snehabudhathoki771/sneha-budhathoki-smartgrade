using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartGrade.Data;
using SmartGrade.DTOs.Admin;
using SmartGrade.Models;
using SmartGrade.Services;

namespace SmartGrade.Controllers
{ 
        [Route("api/admin/grades")]
        [ApiController]
        [Authorize(Roles = "Admin")]
        public class AdminGradeController : ControllerBase
        {
            private readonly AppDbContext _context;

            public AdminGradeController(AppDbContext context)
            {
                _context = context;
            }

            [HttpGet]
            public async Task<IActionResult> GetGrades()
            {
                var grades = await _context.GradeScales
                    .OrderByDescending(g => g.MinPercentage)
                    .ToListAsync();

                return Ok(grades);
            }
        [HttpPost]
        public async Task<IActionResult> CreateGrade([FromBody] CreateGradeDto model)
        {
            if (model.MinPercentage < 0 || model.MaxPercentage > 100)
                return BadRequest("Percentage must be between 0 and 100.");

            if (model.MinPercentage > model.MaxPercentage)
                return BadRequest("Min percentage cannot be greater than max percentage.");

            // Overlap Check
            var overlap = await _context.GradeScales
                .Where(g => g.IsActive)
                .AnyAsync(g =>
                    model.MinPercentage <= g.MaxPercentage &&
                    model.MaxPercentage >= g.MinPercentage
                );

            if (overlap)
                return BadRequest("Grade range overlaps with existing grade.");

            var grade = new GradeScale
            {
                GradeName = model.GradeName,
                MinPercentage = model.MinPercentage,
                MaxPercentage = model.MaxPercentage,
                GpaValue = model.GpaValue
            };

            _context.GradeScales.Add(grade);
            await _context.SaveChangesAsync();
            await RecalculateAllResults();

            return Ok(grade);

        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGrade(int id, [FromBody] CreateGradeDto model)
        {
            var existing = await _context.GradeScales.FindAsync(id);

            if (existing == null)
                return NotFound("Grade not found.");

            if (model.MinPercentage < 0 || model.MaxPercentage > 100)
                return BadRequest("Percentage must be between 0 and 100.");

            if (model.MinPercentage > model.MaxPercentage)
                return BadRequest("Min percentage cannot be greater than max percentage.");

            // Get overlapping grades (excluding current)
            var overlappingGrades = await _context.GradeScales
                .Where(g => g.Id != id && g.IsActive)
                .Where(g =>
                    model.MinPercentage <= g.MaxPercentage &&
                    model.MaxPercentage >= g.MinPercentage)
                .ToListAsync();

            foreach (var grade in overlappingGrades)
            {
                // Case 1: Edited range cuts top of another grade
                if (model.MinPercentage > grade.MinPercentage &&
                    model.MinPercentage <= grade.MaxPercentage)
                {
                    grade.MaxPercentage = model.MinPercentage - 1;
                }

                // Case 2: Edited range cuts bottom of another grade
                if (model.MaxPercentage >= grade.MinPercentage &&
                    model.MaxPercentage < grade.MaxPercentage)
                {
                    grade.MinPercentage = model.MaxPercentage + 1;
                }

                // Case 3: Fully covered grade → deactivate
                if (model.MinPercentage <= grade.MinPercentage &&
                    model.MaxPercentage >= grade.MaxPercentage)
                {
                    grade.IsActive = false;
                }
            }

            // Update current grade
            existing.GradeName = model.GradeName;
            existing.MinPercentage = model.MinPercentage;
            existing.MaxPercentage = model.MaxPercentage;
            existing.GpaValue = model.GpaValue;

            await _context.SaveChangesAsync();
            await RecalculateAllResults();

            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGrade(int id)
        {
            var grade = await _context.GradeScales.FindAsync(id);

            if (grade == null)
                return NotFound("Grade not found.");

            _context.GradeScales.Remove(grade);
            await _context.SaveChangesAsync();
            await RecalculateAllResults();

            return Ok("Grade deleted successfully.");
        }

        private async Task RecalculateAllResults()
        {
            var results = await _context.StudentSubjectResults.ToListAsync();

            var gradeScales = await _context.GradeScales
                .Where(g => g.IsActive)
                .OrderByDescending(g => g.MinPercentage)
                .ToListAsync();

            foreach (var result in results)
            {
                var percentage = result.FinalPercentage;

                var matchedGrade = gradeScales.FirstOrDefault(gs =>
                    percentage >= (decimal)gs.MinPercentage &&
                    percentage <= (decimal)gs.MaxPercentage);

                result.Grade = matchedGrade?.GradeName ?? "N/A";
                result.GPA = matchedGrade != null ? (decimal)matchedGrade.GpaValue : 0;
            }

            await _context.SaveChangesAsync();
            
        }

    }
}
