# ⚙️ SmaRTC C# SDK

SDK C#/.NET pour intégrer la visioconférence SmaRTC dans vos applications Windows, Unity, et .NET.

## ⚡ Installation

### Via NuGet (recommandé)

```bash
dotnet add package SmaRTC.SDK
# ou via Package Manager Console
Install-Package SmaRTC.SDK
```

### Copier les fichiers

Ou copiez simplement `SmaRTCSimple.cs` dans votre projet.

**🎯 [Voir QuickStart.cs](examples/QuickStart.cs)**

### Manuellement

1. Téléchargez la DLL depuis [Releases](https://github.com/DeLTa-X-Tunisia/SmaRTC/releases)
2. Ajoutez la référence à votre projet

## 🚀 Quick Start (3 lignes)

### Wrapper Simplifié (Recommandé)

```csharp
using SmaRTC.Client;

var client = new SmaRTCSimple();
await client.LoginAsync("alice", "password123");
var session = await client.StartCallAsync("Réunion .NET");
```

### SDK Complet

```csharp
using SmaRTC.SDK;

var client = new SmaRTCClient(new SmaRTCConfig
{
    ApiUrl = "https://api.votre-domaine.com",
    SignalServerUrl = "https://signal.votre-domaine.com/signalhub",
    StunServers = new[] { "stun:stun.l.google.com:19302" }
});
```

### 2. Se connecter

```csharp
try
{
    await client.Auth.LoginAsync("user@example.com", "motdepasse");
    Console.WriteLine("✅ Connecté avec succès");
}
catch (AuthenticationException ex)
{
    Console.WriteLine($"❌ Erreur: {ex.Message}");
}
```

### 3. Créer et rejoindre une session

```csharp
// Créer une session
var session = await client.Sessions.CreateAsync(new CreateSessionRequest
{
    Name = "Réunion d'équipe",
    Description = "Daily standup"
});

// Rejoindre la session
await client.WebRTC.JoinAsync(session.Id, new JoinOptions
{
    Audio = true,
    Video = true,
    OnLocalStream = (stream) =>
    {
        // Afficher le flux vidéo local
        LocalVideoElement.SetStream(stream);
    },
    OnRemoteStream = (userId, stream) =>
    {
        // Afficher le flux vidéo distant
        AddRemoteVideo(userId, stream);
    }
});
```

## 📱 Exemple complet (WPF)

```csharp
using System.Windows;
using SmaRTC.SDK;

namespace SmaRTCDemo
{
    public partial class MainWindow : Window
    {
        private SmaRTCClient _client;

        public MainWindow()
        {
            InitializeComponent();
            InitializeClient();
        }

        private void InitializeClient()
        {
            _client = new SmaRTCClient(new SmaRTCConfig
            {
                ApiUrl = "http://localhost:8080",
                SignalServerUrl = "http://localhost:5001/signalhub",
                Debug = true
            });
        }

        private async void LoginButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                // 1. Login
                await _client.Auth.LoginAsync(UsernameBox.Text, PasswordBox.Password);
                StatusLabel.Content = "✅ Connecté";

                // 2. Créer une session
                var session = await _client.Sessions.CreateAsync(new CreateSessionRequest
                {
                    Name = "WPF Session",
                    Description = "Test depuis WPF"
                });

                // 3. Rejoindre la session
                await _client.WebRTC.JoinAsync(session.Id, new JoinOptions
                {
                    Audio = true,
                    Video = true,
                    OnLocalStream = (stream) =>
                    {
                        Dispatcher.Invoke(() =>
                        {
                            LocalVideo.SetMediaStream(stream);
                        });
                    },
                    OnRemoteStream = (userId, stream) =>
                    {
                        Dispatcher.Invoke(() =>
                        {
                            AddRemoteVideo(userId, stream);
                        });
                    }
                });

                LoginPanel.Visibility = Visibility.Collapsed;
                CallPanel.Visibility = Visibility.Visible;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Erreur: {ex.Message}", "Erreur", 
                    MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void MuteButton_Click(object sender, RoutedEventArgs e)
        {
            _client.WebRTC.ToggleMuteAsync();
        }

        private void CameraButton_Click(object sender, RoutedEventArgs e)
        {
            _client.WebRTC.ToggleCameraAsync();
        }

        private async void LeaveButton_Click(object sender, RoutedEventArgs e)
        {
            await _client.WebRTC.LeaveAsync();
            await _client.Auth.LogoutAsync();

            CallPanel.Visibility = Visibility.Collapsed;
            LoginPanel.Visibility = Visibility.Visible;
        }

        private void AddRemoteVideo(string userId, MediaStream stream)
        {
            var videoElement = new MediaElement
            {
                Width = 320,
                Height = 240
            };
            videoElement.SetMediaStream(stream);
            RemoteVideosPanel.Children.Add(videoElement);
        }
    }
}
```

## 🎮 Exemple Unity

```csharp
using UnityEngine;
using SmaRTC.SDK;

public class VideoCallManager : MonoBehaviour
{
    private SmaRTCClient _client;
    
    [Header("Configuration")]
    public string apiUrl = "http://localhost:8080";
    public string signalUrl = "http://localhost:5001/signalhub";

    [Header("Credentials")]
    public string username = "demo";
    public string password = "Demo123!";

    async void Start()
    {
        // Initialiser le SDK
        _client = new SmaRTCClient(new SmaRTCConfig
        {
            ApiUrl = apiUrl,
            SignalServerUrl = signalUrl,
            Debug = true
        });

        try
        {
            // Login
            await _client.Auth.LoginAsync(username, password);
            Debug.Log("✅ Connecté");

            // Créer une session
            var session = await _client.Sessions.CreateAsync(new CreateSessionRequest
            {
                Name = "Unity Session"
            });

            // Rejoindre
            await _client.WebRTC.JoinAsync(session.Id, new JoinOptions
            {
                Audio = true,
                Video = true,
                OnLocalStream = OnLocalStream,
                OnRemoteStream = OnRemoteStream
            });
        }
        catch (System.Exception ex)
        {
            Debug.LogError($"❌ Erreur: {ex.Message}");
        }
    }

    private void OnLocalStream(MediaStream stream)
    {
        Debug.Log("📹 Local stream received");
        // Afficher sur une texture ou RawImage
    }

    private void OnRemoteStream(string userId, MediaStream stream)
    {
        Debug.Log($"📹 Remote stream from {userId}");
        // Créer un GameObject avec RawImage pour afficher la vidéo
    }

    public void ToggleMute()
    {
        _client.WebRTC.ToggleMuteAsync();
    }

    public void ToggleCamera()
    {
        _client.WebRTC.ToggleCameraAsync();
    }

    async void OnDestroy()
    {
        await _client?.WebRTC.LeaveAsync();
        await _client?.Auth.LogoutAsync();
    }
}
```

## 📦 API Reference

### Client

```csharp
var client = new SmaRTCClient(config);
```

**Config:**
```csharp
public class SmaRTCConfig
{
    public string ApiUrl { get; set; }
    public string SignalServerUrl { get; set; }
    public string[] StunServers { get; set; }
    public TurnServer[] TurnServers { get; set; }
    public bool AutoReconnect { get; set; } = true;
    public bool Debug { get; set; } = false;
}
```

### Auth

```csharp
// Login
await client.Auth.LoginAsync(username, password);

// Register
await client.Auth.RegisterAsync(username, password, role);

// Logout
await client.Auth.LogoutAsync();

// Check if authenticated
bool isAuth = client.Auth.IsAuthenticated;

// Get current user
User user = client.Auth.CurrentUser;
```

### Sessions

```csharp
// Get all sessions
var sessions = await client.Sessions.GetAllAsync();

// Get session by ID
var session = await client.Sessions.GetByIdAsync(sessionId);

// Create session
var session = await client.Sessions.CreateAsync(new CreateSessionRequest
{
    Name = "Session name",
    Description = "Optional description"
});

// Delete session
await client.Sessions.DeleteAsync(sessionId);
```

### WebRTC

```csharp
// Join session
await client.WebRTC.JoinAsync(sessionId, new JoinOptions
{
    Audio = true,
    Video = true,
    OnLocalStream = (stream) => { },
    OnRemoteStream = (userId, stream) => { },
    OnUserJoined = (userId) => { },
    OnUserLeft = (userId) => { },
    OnError = (error) => { }
});

// Leave session
await client.WebRTC.LeaveAsync();

// Toggle microphone
await client.WebRTC.ToggleMuteAsync();

// Toggle camera
await client.WebRTC.ToggleCameraAsync();

// Get stats
var stats = await client.WebRTC.GetStatsAsync();
```

## 🔧 Configuration avancée

### Avec TURN servers

```csharp
var client = new SmaRTCClient(new SmaRTCConfig
{
    ApiUrl = "https://api.example.com",
    SignalServerUrl = "https://signal.example.com/signalhub",
    StunServers = new[] { "stun:stun.l.google.com:19302" },
    TurnServers = new[]
    {
        new TurnServer
        {
            Urls = "turn:turn.example.com:3478",
            Username = "user",
            Credential = "password"
        }
    }
});
```

### Gestion des erreurs

```csharp
try
{
    await client.Auth.LoginAsync("user", "password");
}
catch (AuthenticationException ex)
{
    Console.WriteLine($"Identifiants invalides: {ex.Message}");
}
catch (NetworkException ex)
{
    Console.WriteLine($"Problème de connexion: {ex.Message}");
}
catch (SmaRTCException ex)
{
    Console.WriteLine($"Erreur SDK: {ex.Message}");
}
```

### Events

```csharp
// Connection events
client.Connected += () => Console.WriteLine("Connecté");
client.Disconnected += () => Console.WriteLine("Déconnecté");
client.Reconnecting += () => Console.WriteLine("Reconnexion...");

// Session events
client.SessionCreated += (session) => { };
client.SessionUpdated += (session) => { };
client.SessionDeleted += (sessionId) => { };

// Participant events
client.ParticipantJoined += (userId, sessionId) => { };
client.ParticipantLeft += (userId, sessionId) => { };
```

## 🐛 Troubleshooting

### Problème de caméra/micro

```csharp
// Vérifier les permissions (Windows)
var hasCamera = await MediaCapture.CheckCameraPermissionAsync();
var hasMicrophone = await MediaCapture.CheckMicrophonePermissionAsync();

if (!hasCamera || !hasMicrophone)
{
    await MediaCapture.RequestPermissionsAsync();
}
```

### CORS issues (Blazor)

```csharp
// Dans Program.cs (Blazor Server)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("http://localhost:5000")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});
```

## 📚 Ressources

- [Documentation complète](https://docs.smartc.tn)
- [Exemples](./examples/)
- [API Reference](https://docs.smartc.tn/api)
- [NuGet Package](https://www.nuget.org/packages/SmaRTC.SDK)

## 📄 Licence

MIT License - voir [LICENSE](../../LICENSE)

---

**Made with ❤️ by DeLTa-X Tunisia**
