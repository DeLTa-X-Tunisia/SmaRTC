using TunRTC.SignalServer.Hubs;
using TunRTC.SignalServer.Network;
using System.Text.Json;

var builder = WebApplication.CreateSlimBuilder(args);

// Ultra-minimal configuration for maximum performance
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Warning);

// Configure Kestrel for high-performance
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxConcurrentConnections = 1_000_000;
    options.Limits.MaxConcurrentUpgradedConnections = 1_000_000;
    options.Limits.MaxRequestBodySize = 1024; // 1KB max for signals
    options.Limits.MinRequestBodyDataRate = null;
    options.Limits.MinResponseDataRate = null;
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(10);
    options.AddServerHeader = false;
});

// Add minimal CORS for production
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(builder.Configuration["AllowedOrigins"]?.Split(',') ?? new[] { "*" })
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Configure SignalR with extreme optimizations
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = false;
    options.MaximumReceiveMessageSize = 1024; // 1KB max message
    options.StreamBufferCapacity = 5;
    options.MaximumParallelInvocationsPerClient = 10;
    options.ClientTimeoutInterval = TimeSpan.FromMinutes(2);
    options.KeepAliveInterval = TimeSpan.FromSeconds(30);
    options.HandshakeTimeout = TimeSpan.FromSeconds(5);
})
.AddMessagePackProtocol(options =>
{
    options.SerializerOptions = MessagePack.MessagePackSerializerOptions.Standard
        .WithCompression(MessagePack.MessagePackCompression.Lz4BlockArray);
});

// Add adaptive mesh network as singleton
builder.Services.AddSingleton<AdaptiveMeshNetwork>();

// Configure JSON for minimal size
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    options.SerializerOptions.WriteIndented = false;
});

var app = builder.Build();

// Enable CORS
app.UseCors();

// Minimal routing
app.MapGet("/", () => Results.Json(new 
{ 
    service = "SmaRTC-ZeroCost",
    version = "2.0.0",
    status = "operational"
}));

app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    uptime = Environment.TickCount64,
    memory = GC.GetTotalMemory(false)
}));

app.MapGet("/stats", async (HttpContext context, AdaptiveMeshNetwork meshNetwork) =>
{
    var globalStats = new
    {
        timestamp = DateTime.UtcNow,
        memory = new
        {
            used = GC.GetTotalMemory(false),
            gen0 = GC.CollectionCount(0),
            gen1 = GC.CollectionCount(1),
            gen2 = GC.CollectionCount(2)
        },
        threads = ThreadPool.ThreadCount,
        cpu = Environment.ProcessorCount
    };
    
    return Results.Json(globalStats);
});

// Map optimized hub
app.MapHub<ZeroCostWebRtcHub>("/signalhub");

// Start background maintenance tasks
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
var meshNetwork = app.Services.GetRequiredService<AdaptiveMeshNetwork>();
var logger = app.Services.GetRequiredService<ILogger<Program>>();

lifetime.ApplicationStarted.Register(() =>
{
    logger.LogInformation("SmaRTC ZeroCost Signal Server started");
    
    // Start cleanup task
    _ = ZeroCostWebRtcHub.RunCleanupAsync(lifetime.ApplicationStopping);
    
    // Start mesh network maintenance
    _ = meshNetwork.RunMaintenanceAsync(lifetime.ApplicationStopping);
});

lifetime.ApplicationStopping.Register(() =>
{
    logger.LogInformation("SmaRTC ZeroCost Signal Server stopping");
});

app.Run();
