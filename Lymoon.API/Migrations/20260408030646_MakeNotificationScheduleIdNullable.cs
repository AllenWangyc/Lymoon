using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lymoon.API.Migrations
{
    /// <inheritdoc />
    public partial class MakeNotificationScheduleIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_notifications_schedules_ScheduleId",
                table: "notifications");

            migrationBuilder.AlterColumn<Guid>(
                name: "ScheduleId",
                table: "notifications",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddForeignKey(
                name: "FK_notifications_schedules_ScheduleId",
                table: "notifications",
                column: "ScheduleId",
                principalTable: "schedules",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_notifications_schedules_ScheduleId",
                table: "notifications");

            migrationBuilder.AlterColumn<Guid>(
                name: "ScheduleId",
                table: "notifications",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_notifications_schedules_ScheduleId",
                table: "notifications",
                column: "ScheduleId",
                principalTable: "schedules",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
