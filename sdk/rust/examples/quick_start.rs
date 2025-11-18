use smartc::{Config, SmaRTCClient, SmaRTCError};
use std::time::Duration;

/*
 * 🦀 SmaRTC Rust Quick Start
 *
 * Démontre le workflow de base :
 * 1. Login
 * 2. Créer un appel
 * 3. Lister les appels
 * 4. Terminer l'appel
 * 5. Logout
 */

#[tokio::main]
async fn main() -> Result<(), SmaRTCError> {
    println!("🦀 SmaRTC Rust Quick Start");
    println!("{}", "=".repeat(40));

    // Initialiser le client avec logs activés
    let config = Config {
        api_base_url: "http://localhost:8080".to_string(),
        signal_server_url: "http://localhost:5001".to_string(),
        timeout: Duration::from_secs(10),
        enable_logs: true,
    };

    let mut client = SmaRTCClient::new(Some(config));

    // 1. Login
    println!("\n🔐 Connexion...");
    client.login("alice", "password123").await?;
    println!(
        "✅ Connecté en tant que : {}",
        client.current_username().unwrap()
    );

    // 2. Créer un appel
    println!("\n📞 Création d'un appel...");
    let session = client.start_call("Réunion Rust").await?;
    println!("✅ Appel créé :");
    println!("   - Session ID : {}", session.session_id);
    println!("   - Room Name  : {}", session.room_name);
    println!("   - Host       : {}", session.host_user_id);

    // 3. Lister les appels disponibles
    println!("\n📋 Appels en cours...");
    let calls = client.get_available_calls().await?;
    println!("✅ {} appel(s) actif(s)", calls.len());
    for call in &calls {
        println!(
            "   - {} ({} participant(s))",
            call.room_name,
            call.participants.len()
        );
    }

    // 4. Récupérer les serveurs ICE
    println!("\n🧊 Serveurs ICE...");
    let ice_servers = client.get_ice_servers().await?;
    println!("✅ {} serveur(s) ICE disponible(s)", ice_servers.len());
    for server in &ice_servers {
        println!("   - {:?}", server.urls);
    }

    // 5. Simuler un appel de 3 secondes
    println!("\n⏳ Appel en cours (3s)...");
    tokio::time::sleep(Duration::from_secs(3)).await;

    // 6. Terminer l'appel
    println!("\n🔴 Fin de l'appel...");
    client.end_call().await?;
    println!("✅ Appel terminé");

    // 7. Déconnexion
    println!("\n👋 Déconnexion...");
    client.logout().await?;
    println!("✅ Session fermée");

    println!("\n{}", "=".repeat(40));
    println!("🎉 Terminé avec succès !");

    Ok(())
}
