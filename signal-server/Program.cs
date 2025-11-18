using TunRTC.SignalServer.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddSignalR();

var app = builder.Build();

// Use CORS
app.UseCors("AllowAll");

app.MapGet("/", () => "Hello World!");

app.MapHub<SignalHub>("/signalhub");

app.Run();
