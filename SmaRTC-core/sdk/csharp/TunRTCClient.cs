using Microsoft.AspNetCore.SignalR.Client;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace TunRTC.Client
{
    /// <summary>
    /// C# SDK for the TunRTC platform.
    /// </summary>
    public class TunRTCClient
    {
        private readonly HttpClient _httpClient;
        private HubConnection _connection;
        private string _token;

        public TunRTCClient(string apiUrl)
        {
            _httpClient = new HttpClient { BaseAddress = new Uri(apiUrl) };
        }

        public async Task LoginAsync(string username, string password)
        {
            var content = new StringContent(JsonSerializer.Serialize(new { username, password }), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("/api/auth/login", content);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            var tokenResponse = JsonSerializer.Deserialize<TokenResponse>(responseContent);
            _token = tokenResponse.Token;

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);
        }

        public async Task ConnectSignalRAsync(string signalUrl)
        {
            _connection = new HubConnectionBuilder()
                .WithUrl(signalUrl, options =>
                {
                    options.AccessTokenProvider = () => Task.FromResult(_token);
                })
                .Build();

            await _connection.StartAsync();
        }

        public async Task<string> CreateSessionAsync()
        {
            var response = await _httpClient.PostAsync("/api/session/create", null);
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            var sessionResponse = JsonSerializer.Deserialize<SessionResponse>(responseContent);
            return sessionResponse.SessionId;
        }

        public async Task JoinSessionAsync(string sessionId)
        {
            var content = new StringContent(JsonSerializer.Serialize(new { sessionId }), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("/api/session/join", content);
            response.EnsureSuccessStatusCode();
        }

        private class TokenResponse { public string Token { get; set; } }
        private class SessionResponse { public string SessionId { get; set; } }
    }
}
