using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://127.0.0.1:8081", 
                "http://localhost:8081",
                "http://127.0.0.1:8082", 
                "http://localhost:8082")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors();
app.MapHub<SimpleWebRtcHub>("/signalhub");

app.MapGet("/", () => "SmaRTC Demo Server Running!");
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

Console.WriteLine("🚀 Server started on http://localhost:5000");
Console.WriteLine("📡 SignalR Hub: http://localhost:5000/signalhub");
app.Run("http://localhost:5000");

// Simple Hub for demo
public class SimpleWebRtcHub : Hub
{
    private static Dictionary<string, List<string>> _sessions = new();
    
    public async Task JoinSession(string sessionId, string username)
    {
        Console.WriteLine($"✅ {username} joined session: {sessionId}");
        
        if (!_sessions.ContainsKey(sessionId))
            _sessions[sessionId] = new List<string>();
            
        _sessions[sessionId].Add(Context.ConnectionId);
        
        await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
        
        // Notify others in the group about new peer
        await Clients.OthersInGroup(sessionId).SendAsync("UserJoined", new
        {
            username,
            connectionId = Context.ConnectionId
        });
        
        // Send existing peers to the new joiner
        var existingPeers = _sessions[sessionId].Where(id => id != Context.ConnectionId).ToList();
        foreach (var peerId in existingPeers)
        {
            await Clients.Caller.SendAsync("UserJoined", new
            {
                username = "Existing User",
                connectionId = peerId
            });
        }
    }
    
    public async Task LeaveSession(string sessionId)
    {
        Console.WriteLine($"👋 User left session: {sessionId}");
        
        if (_sessions.ContainsKey(sessionId))
        {
            _sessions[sessionId].Remove(Context.ConnectionId);
            if (_sessions[sessionId].Count == 0)
                _sessions.Remove(sessionId);
        }
        
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, sessionId);
        await Clients.Group(sessionId).SendAsync("UserLeft", new
        {
            username = "User",
            connectionId = Context.ConnectionId
        });
    }
    
    public async Task SendSignal(string targetPeerId, string signal)
    {
        await Clients.Client(targetPeerId).SendAsync("ReceiveSignal", Context.ConnectionId, signal);
    }
    
    public async Task SetRelayCapability(bool canRelay)
    {
        Console.WriteLine($"🔀 Relay capability set: {canRelay} for {Context.ConnectionId}");
        await Task.CompletedTask;
    }
    
    public async Task UpdatePeerLatency(string peerId, int latency)
    {
        Console.WriteLine($"📊 Latency update: {peerId} -> {latency}ms");
        await Task.CompletedTask;
    }
    
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        foreach (var session in _sessions)
        {
            if (session.Value.Contains(Context.ConnectionId))
            {
                session.Value.Remove(Context.ConnectionId);
                await Clients.Group(session.Key).SendAsync("UserLeft", new
                {
                    username = "User",
                    connectionId = Context.ConnectionId
                });
            }
        }
        await base.OnDisconnectedAsync(exception);
    }
}
