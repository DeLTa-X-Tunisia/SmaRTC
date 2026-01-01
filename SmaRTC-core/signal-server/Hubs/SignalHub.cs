using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace TunRTC.SignalServer.Hubs
{
    public class SignalHub : Hub
    {
        private readonly ILogger<SignalHub> _logger;

        public SignalHub(ILogger<SignalHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation($"Client connected: {Context.ConnectionId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinSession(string sessionId, string username)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
            _logger.LogInformation($"User {username} joined session {sessionId}");
            
            // Notify others in the session
            await Clients.OthersInGroup(sessionId).SendAsync("NewUserArrived", username);
        }

        public async Task LeaveSession(string sessionId, string username)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, sessionId);
            _logger.LogInformation($"User {username} left session {sessionId}");
            
            // Notify others in the session
            await Clients.OthersInGroup(sessionId).SendAsync("UserLeft", username);
        }

        public async Task NewUser(string user)
        {
            _logger.LogInformation($"NewUser: {user}");
            await Clients.All.SendAsync("NewUserArrived", user);
        }

        public async Task SendSignal(string signal, string user)
        {
            _logger.LogInformation($"SendSignal from {Context.ConnectionId} to {user}");
            await Clients.Others.SendAsync("SendSignal", signal, user);
        }

        public async Task SendSignalToSession(string sessionId, string signal, string user)
        {
            _logger.LogInformation($"SendSignalToSession in {sessionId} from {user}");
            await Clients.OthersInGroup(sessionId).SendAsync("SendSignal", signal, user);
        }
    }
}
