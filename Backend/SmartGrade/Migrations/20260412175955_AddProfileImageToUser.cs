using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartGrade.Migrations
{
    /// <inheritdoc />
    public partial class AddProfileImageToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "profile_image",
                table: "Users",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "profile_image_content_type",
                table: "Users",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "profile_image",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "profile_image_content_type",
                table: "Users");
        }
    }
}
