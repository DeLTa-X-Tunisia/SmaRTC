// SmaRTC Go Chat Example
// © 2026 Mounir Azizi - DeLTa-X Tunisia - All Rights Reserved
// This project is for demonstration purposes only.
package main

import (
	"bufio"
	"fmt"
	"os"
	"os/signal"
	"smartc-go-example/sdk"
	"strings"
	"syscall"

	"github.com/fatih/color"
)

const (
	signalHubURL = "http://localhost:5001/signalhub"
	defaultRoom  = "go-chat-room"
)

var (
	cyan    = color.New(color.FgCyan, color.Bold)
	green   = color.New(color.FgGreen, color.Bold)
	yellow  = color.New(color.FgYellow)
	red     = color.New(color.FgRed, color.Bold)
	magenta = color.New(color.FgMagenta)
	blue    = color.New(color.FgBlue, color.Bold)
	white   = color.New(color.FgWhite)
)

func printBanner() {
	cyan.Println(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ███████╗███╗   ███╗ █████╗ ██████╗ ████████╗ ██████╗      ║
║     ██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝██╔════╝      ║
║     ███████╗██╔████╔██║███████║██████╔╝   ██║   ██║           ║
║     ╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║   ██║           ║
║     ███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║   ╚██████╗      ║
║     ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝      ║
║                                                               ║
║              🚀 Go Chat Example - DeLTa-X Tunisia 🇹🇳          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`)
}

func printHelp() {
	yellow.Println("\n📋 Commandes disponibles:")
	white.Println("   /quit    - Quitter le chat")
	white.Println("   /users   - Afficher les utilisateurs")
	white.Println("   /room    - Afficher la room actuelle")
	white.Println("   /help    - Afficher cette aide")
	white.Println("   /clear   - Effacer l'écran")
	fmt.Println()
}

func clearScreen() {
	fmt.Print("\033[H\033[2J")
}

func main() {
	printBanner()

	// Get username
	reader := bufio.NewReader(os.Stdin)
	green.Print("👤 Entrez votre nom d'utilisateur: ")
	username, _ := reader.ReadString('\n')
	username = strings.TrimSpace(username)

	if username == "" {
		username = fmt.Sprintf("GoUser_%d", os.Getpid()%1000)
	}

	// Create client
	client := sdk.NewSmaRTCClient(signalHubURL)

	// Set up event handlers
	client.OnConnected = func() {
		green.Println("✅ Connecté au serveur SignalR!")
	}

	client.OnDisconnected = func() {
		yellow.Println("🔌 Déconnecté du serveur")
	}

	client.OnError = func(err error) {
		red.Printf("❌ Erreur: %v\n", err)
	}

	client.OnSignalReceived = func(user, message string) {
		if user != username {
			blue.Printf("\n💬 %s: ", user)
			white.Println(message)
			green.Print("📝 Vous: ")
		}
	}

	client.OnUserJoined = func(user string) {
		if user != username {
			magenta.Printf("\n👋 %s a rejoint le chat\n", user)
			green.Print("📝 Vous: ")
		}
	}

	client.OnUserLeft = func(user string) {
		yellow.Printf("\n👋 %s a quitté le chat\n", user)
		green.Print("📝 Vous: ")
	}

	// Connect to server
	yellow.Printf("\n🔄 Connexion à %s...\n", signalHubURL)
	err := client.Connect()
	if err != nil {
		red.Printf("❌ Impossible de se connecter: %v\n", err)
		red.Println("💡 Assurez-vous que le serveur Docker est démarré (docker-compose up -d)")
		os.Exit(1)
	}

	// Join room
	yellow.Printf("🚪 Rejoindre la room '%s'...\n", defaultRoom)
	err = client.JoinRoom(defaultRoom, username)
	if err != nil {
		red.Printf("❌ Impossible de rejoindre la room: %v\n", err)
		os.Exit(1)
	}

	green.Printf("✅ Connecté en tant que '%s' dans la room '%s'\n", username, defaultRoom)
	printHelp()

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		yellow.Println("\n\n👋 Déconnexion...")
		client.Disconnect()
		os.Exit(0)
	}()

	// Main chat loop
	green.Print("📝 Vous: ")
	for {
		message, err := reader.ReadString('\n')
		if err != nil {
			break
		}
		message = strings.TrimSpace(message)

		if message == "" {
			green.Print("📝 Vous: ")
			continue
		}

		// Handle commands
		switch strings.ToLower(message) {
		case "/quit", "/exit", "/q":
			yellow.Println("👋 Au revoir!")
			client.Disconnect()
			return

		case "/help", "/h", "/?":
			printHelp()
			green.Print("📝 Vous: ")
			continue

		case "/room":
			cyan.Printf("🚪 Room actuelle: %s\n", client.GetRoomName())
			green.Print("📝 Vous: ")
			continue

		case "/users":
			cyan.Printf("👤 Vous êtes: %s\n", client.GetUsername())
			green.Print("📝 Vous: ")
			continue

		case "/clear", "/cls":
			clearScreen()
			printBanner()
			green.Print("📝 Vous: ")
			continue
		}

		// Send message
		err = client.SendMessage(message)
		if err != nil {
			red.Printf("❌ Erreur d'envoi: %v\n", err)
		}
		green.Print("📝 Vous: ")
	}
}
