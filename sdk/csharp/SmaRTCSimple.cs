// 💜 SmaRTC C# SDK Simplifié
// Wrapper moderne pour .NET 6+ et Unity
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace SmaRTC.Client
{
    /// <summary>
    /// Client SmaRTC simplifié pour .NET
    /// 
    /// Exemple d'utilisation :
    /// <code>
    /// var client = new SmaRTCSimple();
    /// await client.LoginAsync("alice", "password123");
    /// var session = await client.StartCallAsync("Ma réunion");
    /// </code>
    /// </summary>
    public class SmaRTCSimple : IDisposable
    {
        // ====================================================================
        // Configuration
        // ====================================================================

        public class Config
        {
            public string ApiBaseUrl { get; set; } = "http://localhost:8080";
            public string SignalServerUrl { get; set; } = "http://localhost:5001";
            public int TimeoutSeconds { get; set; } = 10;
            public bool EnableLogs { get; set; } = false;
        }

        // ====================================================================
        // Types de données
        // ====================================================================

        public record User(string Id, string Username);

        public record Session(
            string SessionId,
            string RoomName,
            string HostUserId,
            List<string> Participants,
            DateTime CreatedAt,
            bool IsActive
        );

        public record ICEServer(
            List<string> Urls,
            string? Username = null,
            string? Credential = null
        );

        private record LoginRequest(string Username, string Password);
        private record LoginResponse(string Token, User User);
        private record CreateSessionRequest(string RoomName);
        private record JoinSessionRequest(string SessionId);

        // ====================================================================
        // Exceptions
        // ====================================================================

        public class SmaRTCException : Exception
        {
            public SmaRTCException(string message) : base(message) { }
            public SmaRTCException(string message, Exception inner) : base(message, inner) { }
        }

        public class AuthenticationException : SmaRTCException
        {
            public AuthenticationException() : base("Identifiants incorrects") { }
        }

        public class SessionNotFoundException : SmaRTCException
        {
            public SessionNotFoundException() : base("Cet appel n'existe pas") { }
        }

        public class NetworkException : SmaRTCException
        {
            public NetworkException(string message) : base($"Problème de connexion : {message}") { }
            public NetworkException(string message, Exception inner) : base($"Problème de connexion : {message}", inner) { }
        }

        // ====================================================================
        // Client principal
        // ====================================================================

        private readonly HttpClient _httpClient;
        private readonly Config _config;
        private string? _token;
        private string? _currentUsername;
        private string? _currentSessionId;

        public bool IsLoggedIn => !string.IsNullOrEmpty(_token);
        public string? CurrentUsername => _currentUsername;
        public string? CurrentSessionId => _currentSessionId;

        public SmaRTCSimple(Config? config = null)
        {
            _config = config ?? new Config();
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri(_config.ApiBaseUrl),
                Timeout = TimeSpan.FromSeconds(_config.TimeoutSeconds)
            };
        }

        // ====================================================================
        // Méthodes privées
        // ====================================================================

        private async Task<T> RequestAsync<T>(
            HttpMethod method,
            string path,
            object? body = null,
            bool requireAuth = false
        )
        {
            try
            {
                var request = new HttpRequestMessage(method, path);

                if (body != null)
                {
                    request.Content = JsonContent.Create(body);
                }

                if (requireAuth && !string.IsNullOrEmpty(_token))
                {
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);
                }

                if (_config.EnableLogs)
                {
                    Console.WriteLine($"[SmaRTC] {method} {_config.ApiBaseUrl}{path}");
                }

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    throw response.StatusCode switch
                    {
                        System.Net.HttpStatusCode.Unauthorized => new AuthenticationException(),
                        System.Net.HttpStatusCode.NotFound => new SessionNotFoundException(),
                        _ => new SmaRTCException($"Erreur HTTP {(int)response.StatusCode} : {errorBody}")
                    };
                }

                return await response.Content.ReadFromJsonAsync<T>()
                    ?? throw new SmaRTCException("Réponse vide du serveur");
            }
            catch (HttpRequestException ex)
            {
                throw new NetworkException(ex.Message, ex);
            }
            catch (TaskCanceledException ex)
            {
                throw new NetworkException("Timeout", ex);
            }
        }

        // ====================================================================
        // Méthodes publiques
        // ====================================================================

        /// <summary>
        /// Authentifie l'utilisateur
        /// </summary>
        public async Task LoginAsync(string username, string password)
        {
            var request = new LoginRequest(username, password);
            var response = await RequestAsync<LoginResponse>(HttpMethod.Post, "/api/auth/login", request);

            _token = response.Token;
            _currentUsername = response.User.Username;

            if (_config.EnableLogs)
            {
                Console.WriteLine($"[SmaRTC] Connecté en tant que {_currentUsername}");
            }
        }

        /// <summary>
        /// Crée un nouveau compte utilisateur
        /// </summary>
        public async Task<User> RegisterAsync(string username, string password)
        {
            var request = new LoginRequest(username, password);
            return await RequestAsync<User>(HttpMethod.Post, "/api/auth/register", request);
        }

        /// <summary>
        /// Crée un nouvel appel
        /// </summary>
        public async Task<Session> StartCallAsync(string roomName)
        {
            var request = new CreateSessionRequest(roomName);
            var session = await RequestAsync<Session>(HttpMethod.Post, "/api/session", request, true);

            _currentSessionId = session.SessionId;

            if (_config.EnableLogs)
            {
                Console.WriteLine($"[SmaRTC] Appel créé : {session.SessionId}");
            }

            return session;
        }

        /// <summary>
        /// Rejoint un appel existant
        /// </summary>
        public async Task<Session> JoinCallAsync(string sessionId)
        {
            var request = new JoinSessionRequest(sessionId);
            var session = await RequestAsync<Session>(HttpMethod.Post, "/api/session/join", request, true);

            _currentSessionId = session.SessionId;

            if (_config.EnableLogs)
            {
                Console.WriteLine($"[SmaRTC] Appel rejoint : {session.SessionId}");
            }

            return session;
        }

        /// <summary>
        /// Termine l'appel en cours
        /// </summary>
        public async Task EndCallAsync()
        {
            if (string.IsNullOrEmpty(_currentSessionId))
            {
                throw new SmaRTCException("Aucun appel en cours");
            }

            await RequestAsync<object>(HttpMethod.Delete, $"/api/session/{_currentSessionId}", null, true);

            if (_config.EnableLogs)
            {
                Console.WriteLine($"[SmaRTC] Appel terminé : {_currentSessionId}");
            }

            _currentSessionId = null;
        }

        /// <summary>
        /// Liste tous les appels actifs
        /// </summary>
        public async Task<List<Session>> GetAvailableCallsAsync()
        {
            return await RequestAsync<List<Session>>(HttpMethod.Get, "/api/session", null, true);
        }

        /// <summary>
        /// Récupère la configuration STUN/TURN
        /// </summary>
        public async Task<List<ICEServer>> GetICEServersAsync()
        {
            try
            {
                return await RequestAsync<List<ICEServer>>(HttpMethod.Get, "/api/webrtc/ice", null, true);
            }
            catch
            {
                // Fallback vers Google STUN
                return new List<ICEServer>
                {
                    new ICEServer(new List<string> { "stun:stun.l.google.com:19302" })
                };
            }
        }

        /// <summary>
        /// Déconnecte l'utilisateur
        /// </summary>
        public async Task LogoutAsync()
        {
            // Terminer l'appel en cours si existant
            if (!string.IsNullOrEmpty(_currentSessionId))
            {
                try
                {
                    await EndCallAsync();
                }
                catch (Exception ex)
                {
                    if (_config.EnableLogs)
                    {
                        Console.WriteLine($"[SmaRTC] Erreur lors de la fin d'appel : {ex.Message}");
                    }
                }
            }

            _token = null;
            _currentUsername = null;
            _currentSessionId = null;

            if (_config.EnableLogs)
            {
                Console.WriteLine("[SmaRTC] Déconnecté");
            }
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }
}
