using Spectre.Console;

namespace Exemple_csharp
{
    /// <summary>
    /// Programme principal - Exemple d'utilisation du SDK C# SmaRTC
    /// Démonstration de chat entre deux clients
    /// </summary>
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.OutputEncoding = System.Text.Encoding.UTF8;
            Console.Title = "SmaRTC C# Example";

            // Configuration
            var clientNumber = 1;
            var roomName = "Room_csharp";
            var password = "12345678";

            // Parse arguments
            if (args.Length > 0 && int.TryParse(args[0], out var num))
            {
                clientNumber = num;
            }

            var username = $"Client{clientNumber}";
            var color = clientNumber == 1 ? Color.Cyan1 : Color.Magenta1;

            // Header
            AnsiConsole.Clear();
            var panel = new Panel(
                new FigletText("SmaRTC")
                    .Centered()
                    .Color(Color.Blue))
            {
                Border = BoxBorder.Double,
                Padding = new Padding(1, 0, 1, 0)
            };
            AnsiConsole.Write(panel);

            AnsiConsole.MarkupLine($"[bold]Démonstration SDK C# - {username}[/]");
            AnsiConsole.MarkupLine($"[grey]Room: {roomName} | Password: {password}[/]");
            AnsiConsole.WriteLine();

            // Créer et connecter le client
            var chatClient = new ChatClient(
                clientName: $"Client {clientNumber}",
                username: username,
                password: password,
                roomName: roomName,
                clientColor: color
            );

            var connected = await chatClient.ConnectAsync();
            
            if (connected)
            {
                await chatClient.RunChatLoopAsync();
            }
            else
            {
                AnsiConsole.MarkupLine("[red]Impossible de se connecter. Vérifiez que les services SmaRTC sont démarrés.[/]");
                AnsiConsole.MarkupLine("[grey]Utilisez le SmaRTC Service Launcher pour démarrer les services.[/]");
            }

            await chatClient.DisposeAsync();
            
            AnsiConsole.MarkupLine("[grey]Appuyez sur une touche pour fermer...[/]");
            Console.ReadKey();
        }
    }
}
