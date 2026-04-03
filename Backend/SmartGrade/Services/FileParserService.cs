using ClosedXML.Excel;
using Microsoft.AspNetCore.Http;
using SmartGrade.DTOs.Marks;
using System.Globalization;

namespace SmartGrade.Services
{
    public class FileParserService
    {
        public async Task<List<BulkStudentMarkDto>> ParseAsync(IFormFile file)
        {
            var extension = Path.GetExtension(file.FileName).ToLower();

            if (extension == ".csv")
                return await ParseCsvAsync(file);

            if (extension == ".xlsx")
                return await ParseExcelAsync(file);

            throw new Exception("Unsupported file format. Upload .csv or .xlsx");
        }

        // ========================= CSV PARSER =========================
        private async Task<List<BulkStudentMarkDto>> ParseCsvAsync(IFormFile file)
        {
            var result = new List<BulkStudentMarkDto>();

            using var reader = new StreamReader(file.OpenReadStream());
            var headerLine = await reader.ReadLineAsync();

            while (!reader.EndOfStream)
            {
                var line = await reader.ReadLineAsync();
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                var columns = line.Split(',');

                if (columns.Length < 2)
                    continue;

                result.Add(new BulkStudentMarkDto
                {
                    StudentEmail = columns[0].Trim(),
                    Score = decimal.Parse(columns[1].Trim(), CultureInfo.InvariantCulture)
                });
            }

            return result;
        }

        // ========================= EXCEL PARSER =========================
        private async Task<List<BulkStudentMarkDto>> ParseExcelAsync(IFormFile file)
        {
            var result = new List<BulkStudentMarkDto>();

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);

            stream.Position = 0;

            using var workbook = new XLWorkbook(stream);
            var worksheet = workbook.Worksheet(1);

            var rows = worksheet.RangeUsed()?.RowsUsed().Skip(1);

            if (rows == null)
                return result;

            foreach (var row in rows)
            {
                var email = row.Cell(1).GetString();

                var scoreCell = row.Cell(2);
                decimal score = 0;

                if (!decimal.TryParse(
                        scoreCell.GetValue<string>(),
                        NumberStyles.Any,
                        CultureInfo.InvariantCulture,
                        out score))
                {
                    continue; // skip invalid rows
                }

                result.Add(new BulkStudentMarkDto
                {
                    StudentEmail = email.Trim(),
                    Score = score
                });
            }

            return result;
        }

    }

}


