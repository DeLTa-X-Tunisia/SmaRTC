# PowerShell script to create the TunRTC project structure and initial files

# Create directories
New-Item -ItemType Directory -Path "api"
New-Item -ItemType Directory -Path "signal-server"
New-Item -ItemType Directory -Path "stun-turn"
New-Item -ItemType Directory -Path "media-server"
New-Item -ItemType Directory -Path "sdk"
New-Item -ItemType Directory -Path "database"
New-Item -ItemType Directory -Path "docs"
New-Item -ItemType Directory -Path "deploy"

# Create .NET projects
dotnet new webapi -o api
dotnet new web -o signal-server
dotnet add signal-server/signal-server.csproj package Microsoft.AspNetCore.SignalR

# Create solution and add projects
dotnet new sln -n TunRTC
dotnet sln TunRTC.sln add api/api.csproj
dotnet sln TunRTC.sln add signal-server/signal-server.csproj

Write-Host "TunRTC project structure created successfully."
