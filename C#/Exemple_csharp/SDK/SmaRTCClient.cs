using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.SignalR.Client;

namespace Exemple_csharp.SDK
{
    /// <summary>
    /// Client SmaRTC pour la démonstration C#
    /// Gère l'authentification, les sessions et le chat en temps réel
    /// </summary>
    public class SmaRTCClient : IAsyncDisposable
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiUrl;
        private readonly string _signalUrl;
        private HubConnection? _hubConnection;
        private string? _token;
        private string? _username;
        private string? _currentRoom;

        // Events
        public event Action<string, string>? OnMessageReceived;
        public event Action<string>? OnUserJoined;
        public event Action<string>? OnUserLeft;
        public event Action<string>? OnError;
        public event Action? OnConnected;
        public event Action? OnDisconnected;

        // Properties
        public bool IsAuthenticated => !string.IsNullOrEmpty(_token);
        public bool IsConnected => _hubConnection?.State == HubConnectionState.Connected;
        public string? Username => _username;
        public string? CurrentRoom => _currentRoom;

        public SmaRTCClient(string apiUrl = "http://localhost:8080", string signalUrl = "http://localhost:5001")
        {
            _apiUrl = apiUrl;
            _signalUrl = signalUrl;
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri(apiUrl),
                Timeout = TimeSpan.FromSeconds(30)
            };
        }

        #region Authentication

        /// <summary>
        /// Enregistre un nouvel utilisateur
        /// Retourne true si l'inscription réussit ou si l'utilisateur existe déjà
        /// </summary>
        public async Task<bool> RegisterAsync(string username, string email, string password)
        {
            try
            {
                var request = new
                {
                    Username = username,
                    Email = email,
                    Password = password,
                    Role = "User"
                };

                var response = await _httpClient.PostAsJsonAsync("/api/Auth/register", request);
                
                if (response.IsSuccessStatusCode)
                {
                    return true;
                }
                
                var error = await response.Content.ReadAsStringAsync();
                
                // Si l'utilisateur existe déjà, ce n'est pas une vraie erreur
                if (error.Contains("already exists", StringComparison.OrdinalIgnoreCase) ||
                    error.Contains("Username already", StringComparison.OrdinalIgnoreCase))
                {
                    return true; // L'utilisateur existe déjà, on peut continuer
                }
                
                OnError?.Invoke($"Erreur d'inscription: {error}");
                return false;
            }
            catch (Exception ex)
            {
                OnError?.Invoke($"Erreur réseau: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Authentifie l'utilisateur
        /// </summary>
        public async Task<bool> LoginAsync(string username, string password)
        {
            try
            {
                var request = new
                {
                    Username = username,
                    Password = password
                };

                var response = await _httpClient.PostAsJsonAsync("/api/Auth/login", request);
                
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
                    if (result?.Token != null)
                    {
                        _token = result.Token;
                        _username = username;
                        _httpClient.DefaultRequestHeaders.Authorization = 
                            new AuthenticationHeaderValue("Bearer", _token);
                        return true;
                    }
                }
                
                var error = await response.Content.ReadAsStringAsync();
                OnError?.Invoke($"Erreur de connexion: {error}");
                return false;
            }
            catch (Exception ex)
            {
                OnError?.Invoke($"Erreur réseau: {ex.Message}");
                return false;
            }
        }

        #endregion

        #region SignalR Connection

        /// <summary>
        /// Connecte au serveur SignalR pour le chat temps réel
        /// </summary>
        public async Task<bool> ConnectToSignalRAsync()
        {
            if (!IsAuthenticated)
            {
                OnError?.Invoke("Vous devez être authentifié avant de vous connecter au chat");
                return false;
            }

            try
            {
                _hubConnection = new HubConnectionBuilder()
                    .WithUrl($"{_signalUrl}/signalhub", options =>
                    {
                        options.AccessTokenProvider = () => Task.FromResult(_token);
                    })
                    .WithAutomaticReconnect()
                    .Build();

                // Setup event handlers - adapté aux méthodes du SignalHub
                _hubConnection.On<string>("NewUserArrived", (user) =>
                {
                    OnUserJoined?.Invoke(user);
                });

                _hubConnection.On<string>("UserLeft", (user) =>
                {
                    OnUserLeft?.Invoke(user);
                });

                // Pour le chat, on utilise SendSignal avec un format JSON
                _hubConnection.On<string, string>("SendSignal", (signal, user) =>
                {
                    // Traiter le signal comme un message
                    OnMessageReceived?.Invoke(user, signal);
                });

                _hubConnection.Closed += async (error) =>
                {
                    OnDisconnected?.Invoke();
                    if (error != null)
                    {
                        OnError?.Invoke($"Connexion perdue: {error.Message}");
                    }
                    await Task.CompletedTask;
                };

                _hubConnection.Reconnected += async (connectionId) =>
                {
                    OnConnected?.Invoke();
                    // Rejoindre automatiquement la room après reconnexion
                    if (!string.IsNullOrEmpty(_currentRoom))
                    {
                        await JoinRoomAsync(_currentRoom);
                    }
                    await Task.CompletedTask;
                };

                await _hubConnection.StartAsync();
                OnConnected?.Invoke();
                return true;
            }
            catch (Exception ex)
            {
                OnError?.Invoke($"Erreur de connexion SignalR: {ex.Message}");
                return false;
            }
        }

        #endregion

        #region Room Management

        /// <summary>
        /// Rejoint une room de chat (session SignalR)
        /// </summary>
        public async Task<bool> JoinRoomAsync(string roomName)
        {
            if (_hubConnection?.State != HubConnectionState.Connected)
            {
                OnError?.Invoke("Non connecté au serveur de chat");
                return false;
            }

            try
            {
                // Utilise JoinSession du SignalHub
                await _hubConnection.InvokeAsync("JoinSession", roomName, _username);
                _currentRoom = roomName;
                return true;
            }
            catch (Exception ex)
            {
                OnError?.Invoke($"Erreur pour rejoindre la room: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Quitte la room actuelle
        /// </summary>
        public async Task<bool> LeaveRoomAsync()
        {
            if (_hubConnection?.State != HubConnectionState.Connected || string.IsNullOrEmpty(_currentRoom))
            {
                return false;
            }

            try
            {
                // Utilise LeaveSession du SignalHub
                await _hubConnection.InvokeAsync("LeaveSession", _currentRoom, _username);
                _currentRoom = null;
                return true;
            }
            catch (Exception ex)
            {
                OnError?.Invoke($"Erreur pour quitter la room: {ex.Message}");
                return false;
            }
        }

        #endregion

        #region Messaging

        /// <summary>
        /// Envoie un message dans la room actuelle (utilise SendSignalToSession)
        /// </summary>
        public async Task<bool> SendMessageAsync(string message)
        {
            if (_hubConnection?.State != HubConnectionState.Connected)
            {
                OnError?.Invoke("Non connecté au serveur de chat");
                return false;
            }

            if (string.IsNullOrEmpty(_currentRoom))
            {
                OnError?.Invoke("Vous n'êtes dans aucune room");
                return false;
            }

            try
            {
                // Utilise SendSignalToSession du SignalHub pour envoyer des messages
                await _hubConnection.InvokeAsync("SendSignalToSession", _currentRoom, message, _username);
                return true;
            }
            catch (Exception ex)
            {
                OnError?.Invoke($"Erreur d'envoi: {ex.Message}");
                return false;
            }
        }

        #endregion

        #region Cleanup

        public async ValueTask DisposeAsync()
        {
            if (_hubConnection != null)
            {
                await _hubConnection.DisposeAsync();
            }
            _httpClient.Dispose();
        }

        #endregion

        #region Models

        private class LoginResponse
        {
            [JsonPropertyName("token")]
            public string? Token { get; set; }
        }

        #endregion
    }
}
