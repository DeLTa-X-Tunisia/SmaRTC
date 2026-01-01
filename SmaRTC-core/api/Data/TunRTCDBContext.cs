using Microsoft.EntityFrameworkCore;
using TunRTC.API.Models;

namespace TunRTC.API.Data
{
    public class TunRTCDBContext : DbContext
    {
        public TunRTCDBContext(DbContextOptions<TunRTCDBContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Session> Sessions { get; set; }
        public DbSet<Participant> Participants { get; set; }
        public DbSet<StoredFile> StoredFiles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // StoredFile configuration
            modelBuilder.Entity<StoredFile>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.FileHash);
                entity.HasIndex(e => e.SessionId);
                entity.HasIndex(e => e.UploaderId);
                entity.HasIndex(e => e.UploadedAt);
                
                entity.HasOne(e => e.Uploader)
                    .WithMany()
                    .HasForeignKey(e => e.UploaderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Session)
                    .WithMany()
                    .HasForeignKey(e => e.SessionId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
