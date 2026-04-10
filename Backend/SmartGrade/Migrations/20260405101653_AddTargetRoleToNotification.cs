using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartGrade.Migrations
{
    /// <inheritdoc />
    public partial class AddTargetRoleToNotification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "target_role",
                table: "Notifications",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "target_role",
                table: "Notifications");
        }
    }
}
