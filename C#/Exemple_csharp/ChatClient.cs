using Exemple_csharp.SDK;
using Spectre.Console;

namespace Exemple_csharp
{
    /// <summary>
    /// Client de chat pour la démonstration SmaRTC
    /// </summary>
    public class ChatClient
    {
        private readonly SmaRTCClient _client;
        private readonly string _clientName;
        private readonly string _username;
        private readonly string _password;
        private readonly string _roomName;
        private readonly Color _clientColor;
        private bool _isRunning = true;

        public ChatClient(string clientName, string username, string password, string roomName, Color clientColor)
        {
            _clientName = clientName;
            _username = username;
            _password = password;
            _roomName = roomName;
            _clientColor = clientColor;
            _client = new SmaRTCClient();

            SetupEventHandlers();
        }

        private void SetupEventHandlers()
        {
            _client.OnMessageReceived += (user, message) =>
            {
                if (user != _username) // Ne pas afficher ses propres messages en double
                {
                    AnsiConsole.MarkupLine($"[grey][[{DateTime.Now:HH:mm:ss}]][/] [blue]{user}[/]: {Markup.Escape(message)}");
                }
            };

            _client.OnUserJoined += (user) =>
            {
                if (user != _username)
                {
                    AnsiConsole.MarkupLine($"[green]➜ {Markup.Escape(user)} a rejoint la room[/]");
                }
            };

            _client.OnUserLeft += (user) =>
            {
                AnsiConsole.MarkupLine($"[yellow]← {Markup.Escape(user)} a quitté la room[/]");
            };

            _client.OnError += (error) =>
            {
                AnsiConsole.MarkupLine($"[red]⚠ Erreur: {Markup.Escape(error)}[/]");
            };

            _client.OnConnected += () =>
            {
                AnsiConsole.MarkupLine($"[green]✓ Connecté au serveur SignalR[/]");
            };

            _client.OnDisconnected += () =>
            {
                AnsiConsole.MarkupLine($"[yellow]⚠ Déconnecté du serveur[/]");
            };
        }

        public async Task<bool> ConnectAsync()
        {
            AnsiConsole.MarkupLine($"[{_clientColor}]═══════════════════════════════════════[/]");
            AnsiConsole.MarkupLine($"[{_clientColor}]  {_clientName} - Connexion en cours...[/]");
            AnsiConsole.MarkupLine($"[{_clientColor}]═══════════════════════════════════════[/]");

            // Étape 1: Inscription (ignore si déjà inscrit)
            AnsiConsole.MarkupLine($"[grey]→ Inscription de {_username}...[/]");
            var email = $"{_username}@example.com";
            await _client.RegisterAsync(_username, email, _password);

            // Étape 2: Connexion
            AnsiConsole.MarkupLine($"[grey]→ Authentification...[/]");
            var loginSuccess = await _client.LoginAsync(_username, _password);
            if (!loginSuccess)
            {
                AnsiConsole.MarkupLine($"[red]✗ Échec de l'authentification[/]");
                return false;
            }
            AnsiConsole.MarkupLine($"[green]✓ Authentifié en tant que {_username}[/]");

            // Étape 3: Connexion SignalR
            AnsiConsole.MarkupLine($"[grey]→ Connexion au serveur de chat...[/]");
            var signalRSuccess = await _client.ConnectToSignalRAsync();
            if (!signalRSuccess)
            {
                AnsiConsole.MarkupLine($"[red]✗ Échec de connexion SignalR[/]");
                return false;
            }

            // Étape 4: Rejoindre la room
            AnsiConsole.MarkupLine($"[grey]→ Rejoindre la room {_roomName}...[/]");
            var joinSuccess = await _client.JoinRoomAsync(_roomName);
            if (!joinSuccess)
            {
                AnsiConsole.MarkupLine($"[red]✗ Échec pour rejoindre la room[/]");
                return false;
            }
            AnsiConsole.MarkupLine($"[green]✓ Connecté à la room {_roomName}[/]");

            AnsiConsole.MarkupLine($"[{_clientColor}]═══════════════════════════════════════[/]");
            AnsiConsole.MarkupLine($"[grey]Tapez vos messages et appuyez sur Entrée.[/]");
            AnsiConsole.MarkupLine($"[grey]Tapez '/quit' pour quitter.[/]");
            AnsiConsole.MarkupLine($"[{_clientColor}]═══════════════════════════════════════[/]");

            return true;
        }

        public async Task RunChatLoopAsync()
        {
            while (_isRunning)
            {
                var input = Console.ReadLine();
                
                if (string.IsNullOrWhiteSpace(input))
                    continue;

                if (input.Equals("/quit", StringComparison.OrdinalIgnoreCase))
                {
                    _isRunning = false;
                    await _client.LeaveRoomAsync();
                    AnsiConsole.MarkupLine($"[yellow]Déconnexion...[/]");
                    break;
                }

                var sent = await _client.SendMessageAsync(input);
                if (sent)
                {
                    // Afficher son propre message
                    AnsiConsole.MarkupLine($"[grey][[{DateTime.Now:HH:mm:ss}]][/] [{_clientColor}]{_username}[/]: {Markup.Escape(input)}");
                }
            }
        }

        public async ValueTask DisposeAsync()
        {
            await _client.DisposeAsync();
        }
    }
}
