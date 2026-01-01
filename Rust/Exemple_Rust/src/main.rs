// SmaRTC Rust Chat Example
// © 2026 Mounir Azizi - DeLTa-X Tunisia - All Rights Reserved
// This project is for demonstration purposes only.

mod sdk;

use colored::*;
use std::io::{self, BufRead, Write};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

const SIGNAL_HUB_URL: &str = "http://localhost:5001/signalhub";
const DEFAULT_ROOM: &str = "rust-chat-room";

fn print_banner() {
    println!(
        "{}",
        r#"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ███████╗███╗   ███╗ █████╗ ██████╗ ████████╗ ██████╗      ║
║     ██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝██╔════╝      ║
║     ███████╗██╔████╔██║███████║██████╔╝   ██║   ██║           ║
║     ╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║   ██║           ║
║     ███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║   ╚██████╗      ║
║     ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝      ║
║                                                               ║
║            🦀 Rust Chat Example - DeLTa-X Tunisia 🇹🇳          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
"#
        .cyan()
    );
}

fn print_help() {
    println!("\n{}", "📋 Commandes disponibles:".yellow());
    println!("   /quit    - Quitter le chat");
    println!("   /users   - Afficher les utilisateurs");
    println!("   /room    - Afficher la room actuelle");
    println!("   /help    - Afficher cette aide");
    println!("   /clear   - Effacer l'écran");
    println!();
}

fn clear_screen() {
    print!("\x1B[2J\x1B[1;1H");
    io::stdout().flush().unwrap();
}

fn main() {
    print_banner();

    // Get username
    print!("{}", "👤 Entrez votre nom d'utilisateur: ".green().bold());
    io::stdout().flush().unwrap();

    let stdin = io::stdin();
    let mut username = String::new();
    stdin.lock().read_line(&mut username).unwrap();
    let username = username.trim().to_string();

    let username = if username.is_empty() {
        format!("RustUser_{}", std::process::id() % 1000)
    } else {
        username
    };

    // Create client
    let client = sdk::SmaRTCClient::new(SIGNAL_HUB_URL);
    client.set_username(&username);
    client.set_room_name(DEFAULT_ROOM);

    // Handle Ctrl+C
    let running = Arc::new(AtomicBool::new(true));
    let r = running.clone();

    ctrlc::set_handler(move || {
        println!("\n\n{}", "👋 Déconnexion...".yellow());
        r.store(false, Ordering::SeqCst);
        std::process::exit(0);
    })
    .expect("Error setting Ctrl-C handler");

    // Display connection info
    println!(
        "\n{} {}",
        "🔄 Connexion à".yellow(),
        SIGNAL_HUB_URL.cyan()
    );
    
    // Simulate connection (in real implementation, use SignalR client)
    println!(
        "{} {} {} '{}'",
        "✅ Connecté en tant que".green().bold(),
        username.cyan().bold(),
        "dans la room".green(),
        DEFAULT_ROOM.cyan()
    );

    client.set_state(sdk::ConnectionState::Connected);
    print_help();

    // Note about SignalR
    println!("{}", "⚠️  Note: Cette démo utilise une simulation locale.".yellow());
    println!("{}", "    Pour une vraie connexion SignalR, utilisez la lib 'signalrs'.".yellow());
    println!("{}", "    Le SDK est prêt dans src/sdk/mod.rs\n".yellow());

    // Main chat loop
    print!("{}", "📝 Vous: ".green().bold());
    io::stdout().flush().unwrap();

    for line in stdin.lock().lines() {
        if !running.load(Ordering::SeqCst) {
            break;
        }

        let message = match line {
            Ok(m) => m.trim().to_string(),
            Err(_) => break,
        };

        if message.is_empty() {
            print!("{}", "📝 Vous: ".green().bold());
            io::stdout().flush().unwrap();
            continue;
        }

        // Handle commands
        match message.to_lowercase().as_str() {
            "/quit" | "/exit" | "/q" => {
                println!("{}", "👋 Au revoir!".yellow());
                break;
            }
            "/help" | "/h" | "/?" => {
                print_help();
            }
            "/room" => {
                println!(
                    "{} {}",
                    "🚪 Room actuelle:".cyan(),
                    client.room_name().unwrap_or_default().cyan().bold()
                );
            }
            "/users" => {
                println!(
                    "{} {}",
                    "👤 Vous êtes:".cyan(),
                    client.username().unwrap_or_default().cyan().bold()
                );
            }
            "/clear" | "/cls" => {
                clear_screen();
                print_banner();
            }
            _ => {
                // Simulate sending message
                println!(
                    "{} {} {}: {}",
                    "📤".green(),
                    "[Envoyé]".green().dimmed(),
                    username.cyan(),
                    message
                );
            }
        }

        print!("{}", "📝 Vous: ".green().bold());
        io::stdout().flush().unwrap();
    }
}
