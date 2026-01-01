package tn.deltax.smartc.examples;

import tn.deltax.smartc.SmaRTCClient;
import tn.deltax.smartc.SmaRTCClient.*;

import java.util.List;

/**
 * 🚀 SmaRTC Java Quick Start
 * 
 * Démontre le workflow de base :
 * 1. Login
 * 2. Créer un appel
 * 3. Lister les appels
 * 4. Terminer l'appel
 * 5. Logout
 */
public class QuickStart {

    public static void main(String[] args) {
        System.out.println("☕ SmaRTC Java Quick Start");
        System.out.println("========================================");

        // Initialiser le client avec logs activés
        Config config = new Config()
                .apiBaseUrl("http://localhost:8080")
                .signalServerUrl("http://localhost:5001")
                .timeout(10)
                .enableLogs(true);

        SmaRTCClient client = new SmaRTCClient(config);

        try {
            // 1. Login
            System.out.println("\n🔐 Connexion...");
            client.login("alice", "password123").join();
            System.out.println("✅ Connecté en tant que : " + client.getCurrentUsername());

            // 2. Créer un appel
            System.out.println("\n📞 Création d'un appel...");
            Session session = client.startCall("Réunion Backend").join();
            System.out.println("✅ Appel créé :");
            System.out.println("   - Session ID : " + session.sessionId);
            System.out.println("   - Room Name  : " + session.roomName);
            System.out.println("   - Host       : " + session.hostUserId);

            // 3. Lister les appels disponibles
            System.out.println("\n📋 Appels en cours...");
            List<Session> calls = client.getAvailableCalls().join();
            System.out.println("✅ " + calls.size() + " appel(s) actif(s)");
            for (Session call : calls) {
                System.out.println("   - " + call.roomName + " (" + call.participants.size() + " participant(s))");
            }

            // 4. Récupérer les serveurs ICE
            System.out.println("\n🧊 Serveurs ICE...");
            List<ICEServer> iceServers = client.getICEServers().join();
            System.out.println("✅ " + iceServers.size() + " serveur(s) ICE disponible(s)");
            for (ICEServer server : iceServers) {
                System.out.println("   - " + server.urls);
            }

            // 5. Simuler un appel de 3 secondes
            System.out.println("\n⏳ Appel en cours (3s)...");
            Thread.sleep(3000);

            // 6. Terminer l'appel
            System.out.println("\n🔴 Fin de l'appel...");
            client.endCall().join();
            System.out.println("✅ Appel terminé");

            // 7. Déconnexion
            System.out.println("\n👋 Déconnexion...");
            client.logout().join();
            System.out.println("✅ Session fermée");

            System.out.println("\n========================================");
            System.out.println("🎉 Terminé avec succès !");

        } catch (Exception e) {
            System.err.println("❌ Erreur : " + e.getMessage());
            e.printStackTrace();
        } finally {
            // Nettoyage des ressources
            client.close();
        }
    }
}
