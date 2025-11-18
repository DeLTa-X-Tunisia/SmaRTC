package main

import (
	"fmt"
	"log"
	"time"

	"github.com/DeLTa-X-Tunisia/SmaRTC/sdk/go/smartc"
)

/*
 * 🚀 SmaRTC Go Quick Start
 *
 * Démontre le workflow de base :
 * 1. Login
 * 2. Créer un appel
 * 3. Lister les appels
 * 4. Terminer l'appel
 * 5. Logout
 */

func main() {
	fmt.Println("🚀 SmaRTC Go Quick Start")
	fmt.Println(string(make([]byte, 40)))

	// Initialiser le client avec logs activés
	config := &smartc.Config{
		APIBaseURL:  "http://localhost:8080",
		EnableLogs:  true,
		Timeout:     10 * time.Second,
	}
	client := smartc.NewClient(config)

	// 1. Login
	fmt.Println("\n🔐 Connexion...")
	err := client.Login("alice", "password123")
	if err != nil {
		log.Fatalf("❌ Erreur login : %v", err)
	}
	fmt.Printf("✅ Connecté en tant que : %s\n", client.CurrentUsername())

	// 2. Créer un appel
	fmt.Println("\n📞 Création d'un appel...")
	session, err := client.StartCall("Réunion Backend")
	if err != nil {
		log.Fatalf("❌ Erreur création appel : %v", err)
	}
	fmt.Println("✅ Appel créé :")
	fmt.Printf("   - Session ID : %s\n", session.SessionID)
	fmt.Printf("   - Room Name  : %s\n", session.RoomName)
	fmt.Printf("   - Host       : %s\n", session.HostUserID)

	// 3. Lister les appels disponibles
	fmt.Println("\n📋 Appels en cours...")
	calls, err := client.GetAvailableCalls()
	if err != nil {
		log.Fatalf("❌ Erreur liste appels : %v", err)
	}
	fmt.Printf("✅ %d appel(s) actif(s)\n", len(calls))
	for _, call := range calls {
		fmt.Printf("   - %s (%d participant(s))\n", call.RoomName, len(call.Participants))
	}

	// 4. Récupérer les serveurs ICE
	fmt.Println("\n🧊 Serveurs ICE...")
	iceServers, err := client.GetICEServers()
	if err != nil {
		log.Printf("⚠️ Erreur ICE : %v (utilisation Google STUN)", err)
	} else {
		fmt.Printf("✅ %d serveur(s) ICE disponible(s)\n", len(iceServers))
		for _, server := range iceServers {
			fmt.Printf("   - %v\n", server.URLs)
		}
	}

	// 5. Simuler un appel de 3 secondes
	fmt.Println("\n⏳ Appel en cours (3s)...")
	time.Sleep(3 * time.Second)

	// 6. Terminer l'appel
	fmt.Println("\n🔴 Fin de l'appel...")
	err = client.EndCall()
	if err != nil {
		log.Fatalf("❌ Erreur fin appel : %v", err)
	}
	fmt.Println("✅ Appel terminé")

	// 7. Déconnexion
	fmt.Println("\n👋 Déconnexion...")
	err = client.Logout()
	if err != nil {
		log.Fatalf("❌ Erreur logout : %v", err)
	}
	fmt.Println("✅ Session fermée")

	fmt.Println("\n" + string(make([]byte, 40)))
	fmt.Println("🎉 Terminé avec succès !")
}
