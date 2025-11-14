using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using TunRTC.API.Controllers;
using TunRTC.API.Data;
using TunRTC.API.Models;
using Xunit;

namespace TunRTC.API.Tests
{
    public class AdminControllerTests
    {
        private readonly DbContextOptions<TunRTCDBContext> _dbOptions;

        public AdminControllerTests()
        {
            _dbOptions = new DbContextOptionsBuilder<TunRTCDBContext>()
                .UseInMemoryDatabase(databaseName: "TunRTC_Admin_Test")
                .Options;
        }

        private TunRTCDBContext GetContextWithData()
        {
            var context = new TunRTCDBContext(_dbOptions);
            context.Database.EnsureDeleted();
            context.Users.AddRange(new List<User>
            {
                new User { Id = 1, Username = "admin", Role = "Admin", PasswordHash = "hash" },
                new User { Id = 2, Username = "user", Role = "User", PasswordHash = "hash" }
            });
            context.SaveChanges();
            return context;
        }

        [Fact]
        public async Task GetUsers_ShouldReturnAllUsers()
        {
            // Arrange
            using (var context = GetContextWithData())
            {
                var controller = new AdminController(context);

                // Act
                var result = await controller.GetUsers();

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result);
                Assert.NotNull(okResult.Value);
                var users = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value);
                Assert.Equal(2, users.Count());
            }
        }

        [Fact]
        public async Task GetUser_ShouldReturnUser_WhenUserExists()
        {
            // Arrange
            using (var context = GetContextWithData())
            {
                var controller = new AdminController(context);

                // Act
                var result = await controller.GetUser(2);

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result);
                Assert.NotNull(okResult.Value);
                var user = okResult.Value;
                var idProperty = user.GetType().GetProperty("Id");
                Assert.NotNull(idProperty);
                Assert.Equal(2, idProperty.GetValue(user));
            }
        }

        [Fact]
        public async Task GetUser_ShouldReturnNotFound_WhenUserDoesNotExist()
        {
            // Arrange
            using (var context = GetContextWithData())
            {
                var controller = new AdminController(context);

                // Act
                var result = await controller.GetUser(99);

                // Assert
                Assert.IsType<NotFoundResult>(result);
            }
        }

        [Fact]
        public async Task UpdateUserRole_ShouldChangeRole_WhenUserExists()
        {
            // Arrange
            using (var context = GetContextWithData())
            {
                var controller = new AdminController(context);
                var newRole = "Moderator";

                // Act
                var result = await controller.UpdateUserRole(2, new UpdateRoleModel { Role = newRole });

                // Assert
                Assert.IsType<OkObjectResult>(result);
                var user = await context.Users.FindAsync(2);
                Assert.NotNull(user);
                Assert.Equal(newRole, user.Role);
            }
        }

        [Fact]
        public async Task UpdateUserRole_ShouldReturnNotFound_WhenUserDoesNotExist()
        {
            // Arrange
            using (var context = GetContextWithData())
            {
                var controller = new AdminController(context);

                // Act
                var result = await controller.UpdateUserRole(99, new UpdateRoleModel { Role = "Admin" });

                // Assert
                Assert.IsType<NotFoundResult>(result);
            }
        }

        [Fact]
        public async Task DeleteUser_ShouldRemoveUser_WhenUserExists()
        {
            // Arrange
            using (var context = GetContextWithData())
            {
                var controller = new AdminController(context);

                // Act
                var result = await controller.DeleteUser(2);

                // Assert
                Assert.IsType<OkObjectResult>(result);
                var user = await context.Users.FindAsync(2);
                Assert.Null(user);
            }
        }

        [Fact]
        public async Task DeleteUser_ShouldReturnNotFound_WhenUserDoesNotExist()
        {
            // Arrange
            using (var context = GetContextWithData())
            {
                var controller = new AdminController(context);

                // Act
                var result = await controller.DeleteUser(99);

                // Assert
                Assert.IsType<NotFoundResult>(result);
            }
        }
    }
}
