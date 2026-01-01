// SmaRTC Kotlin Chat Example
// © 2026 Mounir Azizi - DeLTa-X Tunisia - All Rights Reserved
// This project is for demonstration purposes only.

package com.smartc

import com.smartc.sdk.SmaRTCClient
import org.fusesource.jansi.AnsiConsole
import org.fusesource.jansi.Ansi
import org.fusesource.jansi.Ansi.ansi
import java.util.Scanner

const val SIGNAL_HUB_URL = "http://localhost:5001/signalhub"
const val DEFAULT_ROOM = "kotlin-chat-room"

fun main() {
    // Initialize colored console
    AnsiConsole.systemInstall()
    
    printBanner()
    
    val scanner = Scanner(System.`in`)
    
    // Get username
    print(ansi().fgGreen().bold().a("👤 Entrez votre nom d'utilisateur: ").reset())
    var username = scanner.nextLine().trim()
    
    if (username.isEmpty()) {
        username = "KotlinUser_${ProcessHandle.current().pid() % 1000}"
    }
    
    // Create client
    val client = SmaRTCClient(SIGNAL_HUB_URL)
    
    // Set up callbacks
    client.onConnected = {
        println(ansi().fgGreen().bold().a("✅ Connecté au serveur SignalR!").reset())
    }
    
    client.onDisconnected = {
        println(ansi().fgYellow().a("🔌 Déconnecté du serveur").reset())
    }
    
    client.onError = { error ->
        println(ansi().fgRed().bold().a("❌ Erreur: ${error.message}").reset())
    }
    
    client.onSignalReceived = { user, message ->
        println()
        print(ansi().fgBlue().bold().a("💬 $user: ").reset())
        println(message)
        print(ansi().fgGreen().bold().a("📝 Vous: ").reset())
    }
    
    client.onUserJoined = { user ->
        println()
        println(ansi().fgMagenta().a("👋 $user a rejoint le chat").reset())
        print(ansi().fgGreen().bold().a("📝 Vous: ").reset())
    }
    
    client.onUserLeft = { user ->
        println()
        println(ansi().fgYellow().a("👋 $user a quitté le chat").reset())
        print(ansi().fgGreen().bold().a("📝 Vous: ").reset())
    }
    
    // Connect
    println()
    println(ansi().fgYellow().a("🔄 Connexion à ").fgCyan().a(SIGNAL_HUB_URL).reset().a("..."))
    
    if (!client.connect()) {
        println(ansi().fgRed().bold().a("❌ Impossible de se connecter!").reset())
        println(ansi().fgYellow().a("💡 Assurez-vous que Docker est démarré (docker-compose up -d)").reset())
        return
    }
    
    // Join room
    println(ansi().fgYellow().a("🚪 Rejoindre la room '").fgCyan().a(DEFAULT_ROOM).fgYellow().a("'...").reset())
    client.joinRoom(DEFAULT_ROOM, username)
    
    println(ansi().fgGreen().bold()
        .a("✅ Connecté en tant que '").fgCyan().a(username)
        .fgGreen().a("' dans la room '").fgCyan().a(DEFAULT_ROOM).fgGreen().a("'").reset())
    
    printHelp()
    
    // Main chat loop
    print(ansi().fgGreen().bold().a("📝 Vous: ").reset())
    
    while (true) {
        val message = scanner.nextLine().trim()
        
        if (message.isEmpty()) {
            print(ansi().fgGreen().bold().a("📝 Vous: ").reset())
            continue
        }
        
        when (message.lowercase()) {
            "/quit", "/exit", "/q" -> {
                println(ansi().fgYellow().a("👋 Au revoir!").reset())
                client.disconnect()
                break
            }
            "/help", "/h", "/?" -> {
                printHelp()
            }
            "/room" -> {
                println(ansi().fgCyan().a("🚪 Room actuelle: ").bold().a(client.getRoomName()).reset())
            }
            "/user", "/users" -> {
                println(ansi().fgCyan().a("👤 Vous êtes: ").bold().a(client.getUsername()).reset())
            }
            "/clear", "/cls" -> {
                print(ansi().eraseScreen().cursor(1, 1))
                printBanner()
            }
            else -> {
                // Send message
                client.sendMessage(message)
            }
        }
        
        print(ansi().fgGreen().bold().a("📝 Vous: ").reset())
    }
    
    // Safe uninstall - ignore errors
    try {
        AnsiConsole.systemUninstall()
    } catch (_: Exception) {
        // Ignore Jansi cleanup errors
    }
}

fun printBanner() {
    println(ansi().fgCyan().a("""
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ███████╗███╗   ███╗ █████╗ ██████╗ ████████╗ ██████╗      ║
║     ██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝██╔════╝      ║
║     ███████╗██╔████╔██║███████║██████╔╝   ██║   ██║           ║
║     ╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║   ██║           ║
║     ███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║   ╚██████╗      ║
║     ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝      ║
║                                                               ║
║          ☕ Kotlin Chat Example - DeLTa-X Tunisia 🇹🇳          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    """.trimIndent()).reset())
}

fun printHelp() {
    println()
    println(ansi().fgYellow().a("📋 Commandes disponibles:").reset())
    println("   /quit    - Quitter le chat")
    println("   /user    - Afficher votre nom")
    println("   /room    - Afficher la room actuelle")
    println("   /help    - Afficher cette aide")
    println("   /clear   - Effacer l'écran")
    println()
}
