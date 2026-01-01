using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Collections.Generic;
using TunRTC.API.Controllers;
using TunRTC.API.Services;
using Xunit;

namespace TunRTC.API.Tests
{
    public class WebRTCControllerTests
    {
        [Fact]
        public void GetIceServers_ShouldReturnIceServersFromConfiguration()
        {
            // Arrange
            var iceServersData = new List<object>
            {
                new { urls = "stun:stun.l.google.com:19302" }
            };

            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?> { })
                .Build();

            var iceServerServiceMock = new Mock<IceServerService>(configuration);
            iceServerServiceMock.Setup(s => s.GetIceServers()).Returns(iceServersData);

            var controller = new WebRTCController(iceServerServiceMock.Object);

            // Act
            var result = controller.GetIceServers();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedIceServers = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value);
            Assert.Equal(iceServersData, returnedIceServers);
        }
    }
}
