package com.smartc.example

import com.smartc.sdk.*
import kotlinx.coroutines.*

/**
 * 🚀 SmaRTC Quick Start - Exemple minimal
 * 
 * Démontre le workflow de base :
 * 1. Login
 * 2. Créer un appel
 * 3. Lister les appels
 * 4. Terminer l'appel
 * 5. Logout
 */
suspend fun main() {
    // Initialiser le client
    val client = SmaRTCSimple()
    
    try {
        println("📱 SmaRTC Quick Start")
        println("=" .repeat(40))
        
        // 1. Connexion
        println("\n🔐 Connexion...")
        client.login(
            username = "alice",
            password = "password123"
        )
        println("✅ Connecté en tant que : ${client.currentUsername}")
        
        // 2. Créer un appel
        println("\n📞 Création d'un appel...")
        val session = client.startCall("Réunion Équipe")
        println("✅ Appel créé :")
        println("   - Session ID : ${session.sessionId}")
        println("   - Room Name  : ${session.roomName}")
        println("   - Host       : ${session.hostUserId}")
        
        // 3. Lister les appels disponibles
        println("\n📋 Appels en cours...")
        val calls = client.getAvailableCalls()
        println("✅ ${calls.size} appel(s) actif(s)")
        calls.forEach { call ->
            println("   - ${call.roomName} (${call.participants.size} participant(s))")
        }
        
        // 4. Simuler un appel de 3 secondes
        println("\n⏳ Appel en cours (3s)...")
        delay(3000)
        
        // 5. Terminer l'appel
        println("\n🔴 Fin de l'appel...")
        client.endCall()
        println("✅ Appel terminé")
        
        // 6. Déconnexion
        println("\n👋 Déconnexion...")
        client.logout()
        println("✅ Session fermée")
        
        println("\n" + "=".repeat(40))
        println("🎉 Terminé avec succès !")
        
    } catch (e: SmaRTCException.AuthenticationError) {
        println("❌ Erreur d'authentification : ${e.message}")
    } catch (e: SmaRTCException.SessionNotFoundError) {
        println("❌ Session introuvable : ${e.message}")
    } catch (e: SmaRTCException.NetworkError) {
        println("❌ Erreur réseau : ${e.message}")
    } catch (e: SmaRTCException) {
        println("❌ Erreur : ${e.message}")
    } finally {
        // Cleanup
        if (client.isLoggedIn) {
            client.logout()
        }
    }
}
