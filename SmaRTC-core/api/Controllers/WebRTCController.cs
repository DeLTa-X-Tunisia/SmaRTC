using Microsoft.AspNetCore.Mvc;
using TunRTC.API.Services;

namespace TunRTC.API.Controllers
{
    [ApiController]
    [Route("api/webrtc")]
    public class WebRTCController : ControllerBase
    {
        private readonly IceServerService _iceServerService;

        public WebRTCController(IceServerService iceServerService)
        {
            _iceServerService = iceServerService;
        }

        /// <summary>
        /// Gets the ICE servers configuration.
        /// </summary>
        /// <returns>A list of ICE servers.</returns>
        [HttpGet("ice-servers")]
        public IActionResult GetIceServers()
        {
            var iceServers = _iceServerService.GetIceServers();
            return Ok(iceServers);
        }
    }
}
