// SmaRTC Swift Chat Example
// © 2026 Mounir Azizi - DeLTa-X Tunisia - All Rights Reserved
// This project is for demonstration purposes only.

import Foundation

// MARK: - Configuration

let SIGNAL_HUB_URL = "http://localhost:5001/signalhub"
let DEFAULT_ROOM = "swift-chat-room"

// MARK: - ANSI Colors

struct ANSIColors {
    static let reset = "\u{001B}[0m"
    static let bold = "\u{001B}[1m"
    static let red = "\u{001B}[31m"
    static let green = "\u{001B}[32m"
    static let yellow = "\u{001B}[33m"
    static let blue = "\u{001B}[34m"
    static let magenta = "\u{001B}[35m"
    static let cyan = "\u{001B}[36m"
    static let orange = "\u{001B}[38;5;208m"
}

// MARK: - Main Application

@main
struct SmaRTCSwiftApp {
    
    static func main() async {
        printBanner()
        
        // Get username
        print("\(ANSIColors.orange)\(ANSIColors.bold)🍎 Entrez votre nom d'utilisateur: \(ANSIColors.reset)", terminator: "")
        var username = readLine()?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        
        if username.isEmpty {
            username = "SwiftUser_\(ProcessInfo.processInfo.processIdentifier % 1000)"
        }
        
        // Create client
        let client = SmaRTCClient(hubUrl: SIGNAL_HUB_URL)
        
        // Set up callbacks
        client.onConnected = {
            print("\(ANSIColors.green)\(ANSIColors.bold)✅ Connecté au serveur SignalR!\(ANSIColors.reset)")
        }
        
        client.onDisconnected = {
            print("\(ANSIColors.yellow)🔌 Déconnecté du serveur\(ANSIColors.reset)")
        }
        
        client.onError = { error in
            print("\(ANSIColors.red)\(ANSIColors.bold)❌ Erreur: \(error.localizedDescription)\(ANSIColors.reset)")
        }
        
        client.onSignalReceived = { user, message in
            print()
            print("\(ANSIColors.blue)\(ANSIColors.bold)💬 \(user): \(ANSIColors.reset)\(message)")
            print("\(ANSIColors.orange)\(ANSIColors.bold)📝 Vous: \(ANSIColors.reset)", terminator: "")
            fflush(stdout)
        }
        
        client.onUserJoined = { user in
            print()
            print("\(ANSIColors.magenta)👋 \(user) a rejoint le chat\(ANSIColors.reset)")
            print("\(ANSIColors.orange)\(ANSIColors.bold)📝 Vous: \(ANSIColors.reset)", terminator: "")
            fflush(stdout)
        }
        
        client.onUserLeft = { user in
            print()
            print("\(ANSIColors.yellow)👋 \(user) a quitté le chat\(ANSIColors.reset)")
            print("\(ANSIColors.orange)\(ANSIColors.bold)📝 Vous: \(ANSIColors.reset)", terminator: "")
            fflush(stdout)
        }
        
        // Connect
        print()
        print("\(ANSIColors.yellow)🔄 Connexion à \(ANSIColors.cyan)\(SIGNAL_HUB_URL)\(ANSIColors.reset)...")
        
        guard client.connect() else {
            print("\(ANSIColors.red)\(ANSIColors.bold)❌ Impossible de se connecter!\(ANSIColors.reset)")
            print("\(ANSIColors.yellow)💡 Assurez-vous que Docker est démarré (docker-compose up -d)\(ANSIColors.reset)")
            return
        }
        
        // Wait for connection
        try? await Task.sleep(nanoseconds: 2_000_000_000)
        
        guard client.isConnected else {
            print("\(ANSIColors.red)\(ANSIColors.bold)❌ Connexion échouée!\(ANSIColors.reset)")
            return
        }
        
        // Join room
        print("\(ANSIColors.yellow)🚪 Rejoindre la room '\(ANSIColors.cyan)\(DEFAULT_ROOM)\(ANSIColors.yellow)'...\(ANSIColors.reset)")
        client.joinRoom(room: DEFAULT_ROOM, user: username)
        
        print("\(ANSIColors.green)\(ANSIColors.bold)✅ Connecté en tant que '\(ANSIColors.cyan)\(username)\(ANSIColors.green)' dans la room '\(ANSIColors.cyan)\(DEFAULT_ROOM)\(ANSIColors.green)'\(ANSIColors.reset)")
        
        printHelp()
        
        // Main chat loop
        print("\(ANSIColors.orange)\(ANSIColors.bold)📝 Vous: \(ANSIColors.reset)", terminator: "")
        fflush(stdout)
        
        while let input = readLine() {
            let message = input.trimmingCharacters(in: .whitespacesAndNewlines)
            
            if message.isEmpty {
                print("\(ANSIColors.orange)\(ANSIColors.bold)📝 Vous: \(ANSIColors.reset)", terminator: "")
                fflush(stdout)
                continue
            }
            
            switch message.lowercased() {
            case "/quit", "/exit", "/q":
                print("\(ANSIColors.yellow)👋 Au revoir!\(ANSIColors.reset)")
                client.disconnect()
                return
                
            case "/help", "/h", "/?":
                printHelp()
                
            case "/room":
                print("\(ANSIColors.cyan)🚪 Room actuelle: \(ANSIColors.bold)\(client.getRoomName())\(ANSIColors.reset)")
                
            case "/user", "/users":
                print("\(ANSIColors.cyan)👤 Vous êtes: \(ANSIColors.bold)\(client.getUsername())\(ANSIColors.reset)")
                
            case "/clear", "/cls":
                print("\u{001B}[2J\u{001B}[H", terminator: "")
                printBanner()
                
            default:
                // Send message
                client.sendMessage(message)
            }
            
            print("\(ANSIColors.orange)\(ANSIColors.bold)📝 Vous: \(ANSIColors.reset)", terminator: "")
            fflush(stdout)
        }
    }
    
    static func printBanner() {
        print("""
\(ANSIColors.orange)
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ███████╗███╗   ███╗ █████╗ ██████╗ ████████╗ ██████╗      ║
║     ██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝██╔════╝      ║
║     ███████╗██╔████╔██║███████║██████╔╝   ██║   ██║           ║
║     ╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║   ██║           ║
║     ███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║   ╚██████╗      ║
║     ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝      ║
║                                                               ║
║          🍎 Swift Chat Example - DeLTa-X Tunisia 🇹🇳           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
\(ANSIColors.reset)
""")
    }
    
    static func printHelp() {
        print()
        print("\(ANSIColors.yellow)📋 Commandes disponibles:\(ANSIColors.reset)")
        print("   /quit    - Quitter le chat")
        print("   /user    - Afficher votre nom")
        print("   /room    - Afficher la room actuelle")
        print("   /help    - Afficher cette aide")
        print("   /clear   - Effacer l'écran")
        print()
    }
}
