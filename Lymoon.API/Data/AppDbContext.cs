using Lymoon.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Lymoon.API.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<ScheduleMember> ScheduleMembers => Set<ScheduleMember>();
    public DbSet<Shift> Shifts => Set<Shift>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Schedule>(entity =>
        {
            entity.ToTable("schedules");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.InviteCode).HasMaxLength(6).IsFixedLength();
            entity.HasIndex(e => e.InviteCode).IsUnique();
            entity.HasOne(e => e.CreatedBy)
                  .WithMany()
                  .HasForeignKey(e => e.CreatedById)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ScheduleMember>(entity =>
        {
            entity.ToTable("schedule_members");
            entity.HasKey(e => new { e.ScheduleId, e.UserId });
            entity.HasOne(e => e.Schedule)
                  .WithMany(s => s.Members)
                  .HasForeignKey(e => e.ScheduleId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Shift>(entity =>
        {
            entity.ToTable("shifts");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Schedule)
                  .WithMany(s => s.Shifts)
                  .HasForeignKey(e => e.ScheduleId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("notifications");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Schedule)
                  .WithMany(s => s.Notifications)
                  .HasForeignKey(e => e.ScheduleId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
