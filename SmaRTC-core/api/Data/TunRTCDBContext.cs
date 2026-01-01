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
    }
}
