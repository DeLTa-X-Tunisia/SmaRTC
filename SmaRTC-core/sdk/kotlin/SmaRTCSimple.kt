/**
 * SmaRTC Kotlin SDK - Wrapper Simplifié pour Android
 * 
 * @author DeLTa-X Tunisia
 * @version 1.0.0
 */

package tn.smartc.sdk

import kotlinx.coroutines.*
import kotlinx.serialization.*
import kotlinx.serialization.json.Json
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

// ==========================================
// 🔧 Configuration & Models
// ==========================================

@Serializable
data class SmaRTCConfig(
    val apiUrl: String = "http://10.0.2.2:8080", // Android emulator localhost
    val signalServerUrl: String = "http://10.0.2.2:5001/signalhub",
    val stunServers: List<String> = listOf("stun:stun.l.google.com:19302"),
    val turnServers: List<TurnServer> = emptyList(),
    val timeout: Long = 30000
)

@Serializable
data class TurnServer(
    val urls: String,
    val username: String? = null,
    val credential: String? = null
)

@Serializable
data class User(
    val id: Int,
    val username: String,
    val role: String
)

@Serializable
data class Session(
    val id: Int,
    val name: String,
    val description: String? = null,
    val creatorId: Int,
    val createdAt: String
)

@Serializable
data class LoginResponse(
    val token: String
)

@Serializable
data class LoginRequest(
    val username: String,
    val password: String
)

@Serializable
data class RegisterRequest(
    val username: String,
    val password: String,
    val role: String = "User"
)

@Serializable
data class CreateSessionRequest(
    val name: String,
    val description: String? = null
)

@Serializable
data class ICEServerResponse(
    val iceServers: List<ICEServer>
)

@Serializable
data class ICEServer(
    val urls: String
)

// ==========================================
// ❌ Custom Exceptions
// ==========================================

sealed class SmaRTCException(message: String, cause: Throwable? = null) : Exception(message, cause) {
    class AuthenticationError(message: String = "Identifiants incorrects", cause: Throwable? = null) : 
        SmaRTCException(message, cause)
    
    class SessionNotFoundError(message: String = "Cet appel n'existe pas", cause: Throwable? = null) : 
        SmaRTCException(message, cause)
    
    class NetworkError(message: String = "Problème de connexion", cause: Throwable? = null) : 
        SmaRTCException(message, cause)
    
    class GenericError(message: String, cause: Throwable? = null) : 
        SmaRTCException(message, cause)
}

// ==========================================
// 🚀 SmaRTC Client Simplifié
// ==========================================

class SmaRTCSimple(private val config: SmaRTCConfig = SmaRTCConfig()) {
    
    private val json = Json { ignoreUnknownKeys = true }
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(config.timeout, TimeUnit.MILLISECONDS)
        .readTimeout(config.timeout, TimeUnit.MILLISECONDS)
        .writeTimeout(config.timeout, TimeUnit.MILLISECONDS)
        .build()
    
    private var token: String? = null
    private var username: String? = null
    private var currentSessionId: Int? = null
    
    companion object {
        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }
    
    // ==========================================
    // 🔒 Private Helpers
    // ==========================================
    
    private fun getHeaders(): Headers.Builder {
        val builder = Headers.Builder()
            .add("Content-Type", "application/json")
        
        token?.let {
            builder.add("Authorization", "Bearer $it")
        }
        
        return builder
    }
    
    private suspend fun <T> request(
        method: String,
        endpoint: String,
        body: Any? = null,
        parser: (String) -> T
    ): T = withContext(Dispatchers.IO) {
        val url = "${config.apiUrl}$endpoint"
        
        val requestBuilder = Request.Builder()
            .url(url)
            .headers(getHeaders().build())
        
        when (method) {
            "GET" -> requestBuilder.get()
            "POST" -> {
                val requestBody = body?.let {
                    json.encodeToString(it).toRequestBody(JSON_MEDIA_TYPE)
                } ?: "".toRequestBody(JSON_MEDIA_TYPE)
                requestBuilder.post(requestBody)
            }
            "PUT" -> {
                val requestBody = body?.let {
                    json.encodeToString(it).toRequestBody(JSON_MEDIA_TYPE)
                } ?: "".toRequestBody(JSON_MEDIA_TYPE)
                requestBuilder.put(requestBody)
            }
            "DELETE" -> requestBuilder.delete()
        }
        
        try {
            val response = client.newCall(requestBuilder.build()).execute()
            
            when (response.code) {
                401 -> throw SmaRTCException.AuthenticationError()
                404 -> throw SmaRTCException.SessionNotFoundError()
                409 -> throw SmaRTCException.GenericError("Ce nom d'utilisateur existe déjà")
                in 400..599 -> throw SmaRTCException.GenericError("Erreur HTTP ${response.code}")
                204 -> return@withContext parser("{}")
            }
            
            val responseBody = response.body?.string() 
                ?: throw SmaRTCException.NetworkError("Réponse vide")
            
            parser(responseBody)
        } catch (e: IOException) {
            throw SmaRTCException.NetworkError("Problème de connexion: ${e.message}", e)
        } catch (e: SmaRTCException) {
            throw e
        } catch (e: Exception) {
            throw SmaRTCException.GenericError("Erreur inattendue: ${e.message}", e)
        }
    }
    
    // ==========================================
    // 🔐 Authentification
    // ==========================================
    
    /**
     * Se connecter avec username et password
     * @param username Nom d'utilisateur
     * @param password Mot de passe
     * @return true si succès
     * @throws SmaRTCException.AuthenticationError Si identifiants incorrects
     * @throws SmaRTCException.NetworkError Si problème de connexion
     */
    suspend fun login(username: String, password: String): Boolean {
        return try {
            val response = request(
                "POST",
                "/api/auth/login",
                LoginRequest(username, password)
            ) { json.decodeFromString<LoginResponse>(it) }
            
            this.token = response.token
            this.username = username
            
            true
        } catch (e: SmaRTCException) {
            throw e
        } catch (e: Exception) {
            throw SmaRTCException.GenericError("Erreur de connexion", e)
        }
    }
    
    /**
     * Créer un nouveau compte
     * @param username Nom d'utilisateur
     * @param password Mot de passe
     * @param role Rôle (User ou Admin)
     * @return true si succès
     * @throws SmaRTCException.GenericError Si le nom d'utilisateur existe déjà
     */
    suspend fun register(username: String, password: String, role: String = "User"): Boolean {
        return try {
            request(
                "POST",
                "/api/auth/register",
                RegisterRequest(username, password, role)
            ) { Unit }
            
            true
        } catch (e: SmaRTCException) {
            throw e
        } catch (e: Exception) {
            throw SmaRTCException.GenericError("Erreur d'inscription", e)
        }
    }
    
    /**
     * Se déconnecter et nettoyer la session
     */
    suspend fun logout() {
        currentSessionId?.let { endCall() }
        token = null
        username = null
    }
    
    /**
     * Vérifie si l'utilisateur est connecté
     */
    val isLoggedIn: Boolean
        get() = token != null
    
    /**
     * Récupère le nom d'utilisateur actuel
     */
    val currentUsername: String?
        get() = username
    
    // ==========================================
    // 📹 Appels vidéo
    // ==========================================
    
    /**
     * Démarre un appel vidéo (crée une session)
     * @param name Nom de l'appel
     * @param description Description optionnelle
     * @return ID de la session créée
     * @throws SmaRTCException.GenericError Si impossible de créer l'appel
     */
    suspend fun startCall(name: String, description: String? = null): Int {
        return try {
            val session = request(
                "POST",
                "/api/session",
                CreateSessionRequest(name, description)
            ) { json.decodeFromString<Session>(it) }
            
            currentSessionId = session.id
            session.id
        } catch (e: SmaRTCException) {
            throw e
        } catch (e: Exception) {
            throw SmaRTCException.GenericError("Impossible de créer l'appel", e)
        }
    }
    
    /**
     * Rejoindre un appel existant
     * @param sessionId ID de la session à rejoindre
     * @throws SmaRTCException.SessionNotFoundError Si la session n'existe pas
     */
    suspend fun joinCall(sessionId: Int) {
        try {
            request("GET", "/api/session/$sessionId") { 
                json.decodeFromString<Session>(it)
            }
            currentSessionId = sessionId
        } catch (e: SmaRTCException.SessionNotFoundError) {
            throw e
        } catch (e: Exception) {
            throw SmaRTCException.GenericError("Erreur lors de la connexion", e)
        }
    }
    
    /**
     * Termine l'appel en cours
     */
    suspend fun endCall() {
        currentSessionId?.let {
            try {
                // Optionnel: supprimer la session
                // request<Unit>("DELETE", "/api/session/$it") { }
                currentSessionId = null
            } catch (e: Exception) {
                // Ignorer les erreurs
            }
        }
    }
    
    // ==========================================
    // 📋 Sessions disponibles
    // ==========================================
    
    /**
     * Liste tous les appels disponibles
     * @return Liste des sessions
     */
    suspend fun getAvailableCalls(): List<Session> {
        return try {
            request("GET", "/api/session") {
                json.decodeFromString<List<Session>>(it)
            }
        } catch (e: SmaRTCException) {
            throw e
        } catch (e: Exception) {
            throw SmaRTCException.GenericError("Erreur lors de la récupération", e)
        }
    }
    
    /**
     * Récupère les détails d'un appel
     * @param sessionId ID de la session
     * @return Détails de la session
     */
    suspend fun getCallDetails(sessionId: Int): Session {
        return try {
            request("GET", "/api/session/$sessionId") {
                json.decodeFromString<Session>(it)
            }
        } catch (e: SmaRTCException.SessionNotFoundError) {
            throw SmaRTCException.GenericError("Appel introuvable")
        } catch (e: SmaRTCException) {
            throw e
        } catch (e: Exception) {
            throw SmaRTCException.GenericError("Erreur", e)
        }
    }
    
    // ==========================================
    // 🌐 Configuration réseau
    // ==========================================
    
    /**
     * Récupère les serveurs ICE (STUN/TURN)
     * @return Liste des serveurs ICE avec fallback
     */
    suspend fun getIceServers(): List<ICEServer> {
        return try {
            val response = request("GET", "/api/webrtc/ice") {
                json.decodeFromString<ICEServerResponse>(it)
            }
            response.iceServers
        } catch (e: Exception) {
            // Fallback sur Google STUN
            config.stunServers.map { ICEServer(it) }
        }
    }
}
