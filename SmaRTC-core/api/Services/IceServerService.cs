using Microsoft.Extensions.Configuration;
using System.Collections.Generic;

namespace TunRTC.API.Services
{
    public class IceServerService
    {
        private readonly IConfiguration _configuration;

        public IceServerService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public virtual IEnumerable<object>? GetIceServers()
        {
            return _configuration.GetSection("IceServers").Get<IEnumerable<object>>();
        }
    }
}
