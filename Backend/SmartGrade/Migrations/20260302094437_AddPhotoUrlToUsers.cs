using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartGrade.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotoUrlToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Title",
                table: "Notifications",
                newName: "title");

            migrationBuilder.RenameColumn(
                name: "Message",
                table: "Notifications",
                newName: "message");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Notifications",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Notifications",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "IsRead",
                table: "Notifications",
                newName: "is_read");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Notifications",
                newName: "created_at");

            migrationBuilder.AddColumn<string>(
                name: "type",
                table: "Notifications",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_user_id",
                table: "Notifications",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_users_user_id",
                table: "Notifications",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_users_user_id",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_user_id",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "type",
                table: "Notifications");

            migrationBuilder.RenameColumn(
                name: "title",
                table: "Notifications",
                newName: "Title");

            migrationBuilder.RenameColumn(
                name: "message",
                table: "Notifications",
                newName: "Message");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Notifications",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "Notifications",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "is_read",
                table: "Notifications",
                newName: "IsRead");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Notifications",
                newName: "CreatedAt");
        }
    }
}
