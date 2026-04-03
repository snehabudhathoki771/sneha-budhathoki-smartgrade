using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartGrade.Migrations
{
    /// <inheritdoc />
    public partial class AddExamStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Exams",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "Exams");
        }
    }
}
