using Microsoft.EntityFrameworkCore;
using SmartGrade.Models;

namespace SmartGrade.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Exam> Exams { get; set; }
        public DbSet<Subject> Subjects { get; set; }
        public DbSet<StudentSubjectResult> StudentSubjectResults { get; set; }

        public DbSet<AssessmentSection> AssessmentSections { get; set; }
        public DbSet<StudentMark> StudentMarks { get; set; }
        public DbSet<Feedback> Feedbacks { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<GradeScale> GradeScales { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // IMPORTANT:
            // users table already exists in DB
            // EF should use it but NEVER try to create / rename it
            modelBuilder.Entity<User>().ToTable("Users");

            // Relationships
            modelBuilder.Entity<StudentMark>()
                .HasOne(sm => sm.Student)
                .WithMany()
                .HasForeignKey(sm => sm.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<StudentMark>()
                .HasOne(sm => sm.Exam)
                .WithMany()
                .HasForeignKey(sm => sm.ExamId);

            modelBuilder.Entity<StudentMark>()
                .HasOne(sm => sm.Subject)
                .WithMany()
                .HasForeignKey(sm => sm.SubjectId);

            modelBuilder.Entity<StudentMark>()
                .HasOne(sm => sm.Section)
                .WithMany()
                .HasForeignKey(sm => sm.SectionId);

            modelBuilder.Entity<Feedback>()
                .HasOne(f => f.Teacher)
                .WithMany()
                .HasForeignKey(f => f.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Feedback>()
                .HasOne(f => f.Student)
                .WithMany()
                .HasForeignKey(f => f.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Subject>()
                .HasOne(s => s.Exam)
                .WithMany(e => e.Subjects)
                .HasForeignKey(s => s.ExamId)
                .OnDelete(DeleteBehavior.Cascade);

        }
    }
}
