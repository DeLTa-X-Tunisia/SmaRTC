using Xunit;
using TunRTC.API.Controllers;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TunRTC.API.Data;
using Microsoft.EntityFrameworkCore;
using TunRTC.API.Models;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace TunRTC.API.Tests
{
    public class SessionControllerTests
    {
        [Fact]
        public async Task CreateSession_Returns_OkResult_With_SessionId()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<TunRTCDBContext>()
                .UseInMemoryDatabase(databaseName: "TunRTC_Test_Create")
                .Options;

            using (var context = new TunRTCDBContext(options))
            {
                var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
                {
                    new Claim(ClaimTypes.NameIdentifier, "1"),
                }, "mock"));

                var controller = new SessionController(context)
                {
                    ControllerContext = new ControllerContext()
                    {
                        HttpContext = new DefaultHttpContext() { User = user }
                    }
                };

                // Act
                var result = await controller.CreateSession();

                // Assert
                var okResult = Assert.IsType<OkObjectResult>(result);
                var returnValue = okResult.Value;
                Assert.NotNull(returnValue);
                var property = returnValue.GetType().GetProperty("sessionId");
                Assert.NotNull(property);
                var sessionId = property.GetValue(returnValue, null);
                Assert.IsType<string>(sessionId);
            }
        }
    }
}
