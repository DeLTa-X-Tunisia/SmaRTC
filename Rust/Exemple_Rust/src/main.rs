// SmaRTC Rust Chat Example with real SignalR connection
// © 2026 Mounir Azizi - DeLTa-X Tunisia - All Rights Reserved
// This project is for demonstration purposes only.

mod sdk;

use colored::*;
use std::io::{self, BufRead, Write};
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
    println!("   /room    - Afficher la room actuelle");
    println!("   /help    - Afficher cette aide");
    println!("   /clear   - Effacer l'écran");
    println!();
}

fn clear_screen() {
    print!("\x1B[2J\x1B[1;1H");
    io::stdout().flush().unwrap();
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
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

    let username_clone = username.clone();

    // Create client
    let client = Arc::new(sdk::SmaRTCClient::new(SIGNAL_HUB_URL));
    
    // Set callbacks
    let client_ref = unsafe { 
        &mut *(Arc::as_ptr(&client) as *mut sdk::SmaRTCClient) 
    };
    
    client_ref.on_signal = Some(Arc::new(move |user: String, message: String| {
        println!("\n{} {}: {}", "💬".blue(), user.cyan().bold(), message);
        print!("{}", "📝 Vous: ".green().bold());
        io::stdout().flush().unwrap();
    }));

    client_ref.on_user_joined = Some(Arc::new(move |user: String| {
        println!("\n{} {} {}", "👋".magenta(), user.cyan().bold(), "a rejoint le chat".magenta());
        print!("{}", "📝 Vous: ".green().bold());
        io::stdout().flush().unwrap();
    }));

    client_ref.on_user_left = Some(Arc::new(move |user: String| {
        println!("\n{} {} {}", "👋".yellow(), user.cyan().bold(), "a quitté le chat".yellow());
        print!("{}", "📝 Vous: ".green().bold());
        io::stdout().flush().unwrap();
    }));

    // Connect
    println!("\n{} {}", "🔄 Connexion à".yellow(), SIGNAL_HUB_URL.cyan());
    
    match client.connect().await {
        Ok(_) => {
            println!("{}", "✅ Connecté au serveur SignalR!".green().bold());
        }
        Err(e) => {
            println!("{} {}", "❌ Erreur de connexion:".red().bold(), e);
            println!("{}", "💡 Assurez-vous que Docker est démarré (docker-compose up -d)".yellow());
            return Ok(());
        }
    }

    // Join room
    println!("{} '{}'...", "🚪 Rejoindre la room".yellow(), DEFAULT_ROOM.cyan());
    client.join_room(DEFAULT_ROOM, &username_clone).await?;
    
    println!(
        "{} '{}' {} '{}'",
        "✅ Connecté en tant que".green().bold(),
        username_clone.cyan().bold(),
        "dans la room".green(),
        DEFAULT_ROOM.cyan()
    );
    
    print_help();

    // Main chat loop
    print!("{}", "📝 Vous: ".green().bold());
    io::stdout().flush().unwrap();

    let client_loop = client.clone();
    
    for line in stdin.lock().lines() {
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
                let _ = client_loop.leave_room().await;
                break;
            }
            "/help" | "/h" | "/?" => {
                print_help();
            }
            "/room" => {
                let room = client_loop.get_room().await;
                println!("{} {}", "🚪 Room actuelle:".cyan(), room.cyan().bold());
            }
            "/clear" | "/cls" => {
                clear_screen();
                print_banner();
            }
            _ => {
                // Send message
                if let Err(e) = client_loop.send_message(&message).await {
                    println!("{} {}", "❌ Erreur d'envoi:".red(), e);
                }
            }
        }

        print!("{}", "📝 Vous: ".green().bold());
        io::stdout().flush().unwrap();
    }

    Ok(())
}
