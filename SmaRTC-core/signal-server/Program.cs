using TunRTC.SignalServer.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add CORS - Configure for SignalR with credentials
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)  // Allow any origin
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();  // Required for SignalR
    });
});

builder.Services.AddSignalR();

var app = builder.Build();

// Use CORS
app.UseCors("AllowAll");

app.MapGet("/", () => "Hello World!");

app.MapHub<SignalHub>("/signalhub");

app.Run();
