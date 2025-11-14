using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace TunRTC.SignalServer.Hubs
{
    public class SignalHub : Hub
    {
        public async Task NewUser(string user)
        {
            await Clients.All.SendAsync("NewUserArrived", user);
        }

        public async Task SendSignal(string signal, string user)
        {
            await Clients.Others.SendAsync("SendSignal", signal, user);
        }
    }
}
