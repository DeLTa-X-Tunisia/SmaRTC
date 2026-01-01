using System;
using System.Threading.Tasks;
using TunRTC.Client;

namespace SmaRTC.Examples
{
    /// <summary>
    /// 💜 SmaRTC C# Quick Start
    /// 
    /// Démontre le workflow de base :
    /// 1. Login
    /// 2. Créer une session
    /// 3. Rejoindre la session
    /// 4. Connexion SignalR
    /// </summary>
    class QuickStart
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("💜 SmaRTC C# Quick Start");
            Console.WriteLine("========================================");

            // Configuration
            string apiUrl = "http://localhost:8080";
            string signalUrl = "http://localhost:5001/signalhub";

            // Initialiser le client
            var client = new TunRTCClient(apiUrl);

            try
            {
                // 1. Login
                Console.WriteLine("\n🔐 Connexion...");
                await client.LoginAsync("alice", "password123");
                Console.WriteLine("✅ Connecté avec succès");

                // 2. Créer une session
                Console.WriteLine("\n📞 Création d'une session...");
                string sessionId = await client.CreateSessionAsync();
                Console.WriteLine($"✅ Session créée : {sessionId}");

                // 3. Rejoindre la session
                Console.WriteLine("\n👥 Rejoindre la session...");
                await client.JoinSessionAsync(sessionId);
                Console.WriteLine($"✅ Session {sessionId} rejointe");

                // 4. Connexion SignalR
                Console.WriteLine("\n🔌 Connexion SignalR...");
                await client.ConnectSignalRAsync(signalUrl);
                Console.WriteLine("✅ SignalR connecté");

                Console.WriteLine("\n⏳ Appel en cours (5s)...");
                await Task.Delay(5000);

                Console.WriteLine("\n========================================");
                Console.WriteLine("🎉 Terminé avec succès !");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"\n❌ Erreur : {ex.Message}");
                Console.WriteLine($"   Stack trace : {ex.StackTrace}");
            }

            Console.WriteLine("\nAppuyez sur une touche pour quitter...");
            Console.ReadKey();
        }
    }
}
