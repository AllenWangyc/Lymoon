using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lymoon.API.Migrations
{
    /// <inheritdoc />
    public partial class AddScheduleCreatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CreatedAt",
                table: "schedules",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "schedules");
        }
    }
}
