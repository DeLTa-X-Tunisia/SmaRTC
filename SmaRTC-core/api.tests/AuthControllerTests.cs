using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using TunRTC.API.Controllers;
using TunRTC.API.Data;
using TunRTC.API.Models;
using Xunit;

namespace TunRTC.API.Tests
{
    public class AuthControllerTests
    {
        private readonly DbContextOptions<TunRTCDBContext> _dbOptions;
        private readonly Mock<IConfiguration> _configurationMock;

        public AuthControllerTests()
        {
            _dbOptions = new DbContextOptionsBuilder<TunRTCDBContext>()
                .UseInMemoryDatabase(databaseName: "TunRTC_Auth_Test")
                .Options;

            var inMemorySettings = new Dictionary<string, string?> {
                {"Jwt:Key", "your-super-secret-key-that-is-long-enough"},
                {"Jwt:Issuer", "your-issuer"},
                {"Jwt:Audience", "your-audience"},
            };

            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            _configurationMock = new Mock<IConfiguration>();
            _configurationMock.Setup(c => c["Jwt:Key"]).Returns(configuration["Jwt:Key"]);
            _configurationMock.Setup(c => c["Jwt:Issuer"]).Returns(configuration["Jwt:Issuer"]);
            _configurationMock.Setup(c => c["Jwt:Audience"]).Returns(configuration["Jwt:Audience"]);
        }

        [Fact]
        public async Task Register_ShouldReturnOk_WhenUserIsNew()
        {
            // Arrange
            using (var context = new TunRTCDBContext(_dbOptions))
            {
                var controller = new AuthController(context, _configurationMock.Object);
                var model = new RegisterModel { Username = "testuser", Password = "password" };

                // Act
                var result = await controller.Register(model);

                // Assert
                Assert.IsType<OkObjectResult>(result);
                var userInDb = await context.Users.FirstOrDefaultAsync(u => u.Username == "testuser");
                Assert.NotNull(userInDb);
            }
        }

        [Fact]
        public async Task Register_ShouldReturnBadRequest_WhenUserExists()
        {
            // Arrange
            using (var context = new TunRTCDBContext(_dbOptions))
            {
                var existingUser = new User { Username = "existinguser", PasswordHash = "somehash", Role = "User" };
                context.Users.Add(existingUser);
                await context.SaveChangesAsync();

                var controller = new AuthController(context, _configurationMock.Object);
                var model = new RegisterModel { Username = "existinguser", Password = "password" };

                // Act
                var result = await controller.Register(model);

                // Assert
                Assert.IsType<BadRequestObjectResult>(result);
            }
        }

        [Fact]
        public async Task Login_ShouldReturnOkWithToken_WhenCredentialsAreValid()
        {
            // Arrange
            using (var context = new TunRTCDBContext(_dbOptions))
            {
                var password = "password";
                var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);
                var user = new User { Username = "loginuser", PasswordHash = passwordHash, Role = "User" };
                context.Users.Add(user);
                await context.SaveChangesAsync();

                var controller = new AuthController(context, _configurationMock.Object);
                var model = new LoginModel { Username = "loginuser", Password = password };

                // Act
                var result = await controller.Login(model);

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result);
                Assert.NotNull(okResult.Value);
                var tokenProperty = okResult.Value.GetType().GetProperty("token");
                Assert.NotNull(tokenProperty);
                var token = tokenProperty.GetValue(okResult.Value, null);
                Assert.NotNull(token);
            }
        }

        [Fact]
        public async Task Login_ShouldReturnUnauthorized_WhenPasswordIsIncorrect()
        {
            // Arrange
            using (var context = new TunRTCDBContext(_dbOptions))
            {
                var user = new User { Username = "wrongpassuser", PasswordHash = BCrypt.Net.BCrypt.HashPassword("correctpassword"), Role = "User" };
                context.Users.Add(user);
                await context.SaveChangesAsync();

                var controller = new AuthController(context, _configurationMock.Object);
                var model = new LoginModel { Username = "wrongpassuser", Password = "wrongpassword" };

                // Act
                var result = await controller.Login(model);

                // Assert
                Assert.IsType<UnauthorizedObjectResult>(result);
            }
        }

        [Fact]
        public async Task Login_ShouldReturnUnauthorized_WhenUserDoesNotExist()
        {
            // Arrange
            using (var context = new TunRTCDBContext(_dbOptions))
            {
                var controller = new AuthController(context, _configurationMock.Object);
                var model = new LoginModel { Username = "nonexistentuser", Password = "password" };

                // Act
                var result = await controller.Login(model);

                // Assert
                Assert.IsType<UnauthorizedObjectResult>(result);
            }
        }
    }
}
