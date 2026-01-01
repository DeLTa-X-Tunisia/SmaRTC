# 📱 SmaRTC SDK Kotlin

**SDK Android natif pour SmaRTC** – Intégration WebRTC simplifiée pour applications Android modernes.

[![Kotlin](https://img.shields.io/badge/Kotlin-1.9+-7F52FF?logo=kotlin)](https://kotlinlang.org/)
[![Android](https://img.shields.io/badge/Android-5.0+-3DDC84?logo=android)](https://developer.android.com/)
[![Coroutines](https://img.shields.io/badge/Coroutines-Async-blueviolet)](https://kotlinlang.org/docs/coroutines-overview.html)

---

## 📦 Installation

### Gradle (Kotlin DSL)

Ajoutez les dépendances dans `build.gradle.kts` :

```kotlin
dependencies {
    // HTTP client
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    
    // JSON serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
```

Activez la sérialisation Kotlin dans `build.gradle.kts` (niveau app) :

```kotlin
plugins {
    id("org.jetbrains.kotlin.plugin.serialization") version "1.9.20"
}
```

### Permissions Android

Ajoutez dans `AndroidManifest.xml` :

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

---

## 🚀 Quick Start (3 lignes)

```kotlin
val client = SmaRTCSimple()
client.login("alice", "pass123")
val session = client.startCall("Meeting Pro")
```

---

## 📖 Exemples d'utilisation

### 1️⃣ Login et création d'appel (Coroutines)

```kotlin
import kotlinx.coroutines.*

suspend fun quickStart() {
    val client = SmaRTCSimple()
    
    try {
        // Connexion
        client.login("alice", "password123")
        println("✅ Connecté en tant que ${client.currentUsername}")
        
        // Créer un appel
        val session = client.startCall("Réunion Équipe")
        println("📞 Appel créé : ${session.sessionId}")
        
        // Lister les appels disponibles
        val calls = client.getAvailableCalls()
        println("📋 ${calls.size} appels en cours")
        
        // Terminer l'appel
        client.endCall()
        println("✅ Appel terminé")
        
    } catch (e: SmaRTCException.AuthenticationError) {
        println("❌ Identifiants incorrects")
    } catch (e: SmaRTCException.NetworkError) {
        println("❌ Problème réseau : ${e.message}")
    } finally {
        client.logout()
    }
}

// Exécution
fun main() = runBlocking {
    quickStart()
}
```

---

### 2️⃣ Activity Android avec ViewModel

```kotlin
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class CallState(
    val isConnected: Boolean = false,
    val currentCall: Session? = null,
    val error: String? = null
)

class CallViewModel : ViewModel() {
    private val client = SmaRTCSimple()
    
    private val _state = MutableStateFlow(CallState())
    val state: StateFlow<CallState> = _state
    
    fun login(username: String, password: String) {
        viewModelScope.launch {
            try {
                client.login(username, password)
                _state.value = _state.value.copy(
                    isConnected = true,
                    error = null
                )
            } catch (e: SmaRTCException) {
                _state.value = _state.value.copy(
                    error = "Connexion échouée : ${e.message}"
                )
            }
        }
    }
    
    fun startCall(roomName: String) {
        viewModelScope.launch {
            try {
                val session = client.startCall(roomName)
                _state.value = _state.value.copy(currentCall = session)
            } catch (e: SmaRTCException) {
                _state.value = _state.value.copy(
                    error = "Impossible de démarrer l'appel : ${e.message}"
                )
            }
        }
    }
    
    fun endCall() {
        viewModelScope.launch {
            try {
                client.endCall()
                _state.value = _state.value.copy(currentCall = null)
            } catch (e: SmaRTCException) {
                _state.value = _state.value.copy(
                    error = "Erreur lors de la fin d'appel : ${e.message}"
                )
            }
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        viewModelScope.launch {
            client.logout()
        }
    }
}
```

---

### 3️⃣ Jetpack Compose UI

```kotlin
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun CallScreen(viewModel: CallViewModel = viewModel()) {
    val state by viewModel.state.collectAsState()
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "🎥 SmaRTC Call",
            style = MaterialTheme.typography.headlineMedium
        )
        
        if (!state.isConnected) {
            // Login form
            var username by remember { mutableStateOf("") }
            var password by remember { mutableStateOf("") }
            
            TextField(
                value = username,
                onValueChange = { username = it },
                label = { Text("Username") },
                modifier = Modifier.fillMaxWidth()
            )
            
            TextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                modifier = Modifier.fillMaxWidth()
            )
            
            Button(
                onClick = { viewModel.login(username, password) },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Se connecter")
            }
        } else {
            // Call controls
            if (state.currentCall == null) {
                var roomName by remember { mutableStateOf("") }
                
                TextField(
                    value = roomName,
                    onValueChange = { roomName = it },
                    label = { Text("Nom de la réunion") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Button(
                    onClick = { viewModel.startCall(roomName) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("📞 Démarrer l'appel")
                }
            } else {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "📞 Appel en cours",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text("Session : ${state.currentCall?.sessionId}")
                    }
                }
                
                Button(
                    onClick = { viewModel.endCall() },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("🔴 Terminer l'appel")
                }
            }
        }
        
        // Error display
        state.error?.let { error ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer
                )
            ) {
                Text(
                    text = "❌ $error",
                    modifier = Modifier.padding(12.dp),
                    color = MaterialTheme.colorScheme.onErrorContainer
                )
            }
        }
    }
}
```

---

### 4️⃣ Configuration serveur personnalisé

```kotlin
val config = SmaRTCConfig(
    apiBaseUrl = "https://api.mondomaine.com",
    signalServerUrl = "https://signal.mondomaine.com",
    enableLogs = true
)

val client = SmaRTCSimple(config)
```

---

### 5️⃣ Utilisation avec WebRTC natif

```kotlin
import org.webrtc.*

class WebRTCManager(private val smartcClient: SmaRTCSimple) {
    private lateinit var peerConnectionFactory: PeerConnectionFactory
    private var peerConnection: PeerConnection? = null
    
    suspend fun initializeCall(roomName: String) {
        // 1. Créer la session SmaRTC
        val session = smartcClient.startCall(roomName)
        
        // 2. Récupérer les serveurs ICE
        val iceServers = smartcClient.getICEServers().map { server ->
            PeerConnection.IceServer.builder(server.urls.first())
                .apply {
                    server.username?.let { setUsername(it) }
                    server.credential?.let { setPassword(it) }
                }
                .createIceServer()
        }
        
        // 3. Créer la PeerConnection
        val rtcConfig = PeerConnection.RTCConfiguration(iceServers)
        peerConnection = peerConnectionFactory.createPeerConnection(
            rtcConfig,
            object : PeerConnection.Observer {
                override fun onIceCandidate(candidate: IceCandidate) {
                    // Envoyer via SignalR (à implémenter)
                    println("ICE Candidate: ${candidate.sdp}")
                }
                
                override fun onAddStream(stream: MediaStream) {
                    println("Stream ajouté : ${stream.id}")
                }
                
                // Autres callbacks...
                override fun onSignalingChange(state: PeerConnection.SignalingState) {}
                override fun onIceConnectionChange(state: PeerConnection.IceConnectionState) {}
                override fun onIceConnectionReceivingChange(receiving: Boolean) {}
                override fun onIceGatheringChange(state: PeerConnection.IceGatheringState) {}
                override fun onRemoveStream(stream: MediaStream) {}
                override fun onDataChannel(channel: DataChannel) {}
                override fun onRenegotiationNeeded() {}
                override fun onAddTrack(receiver: RtpReceiver, streams: Array<MediaStream>) {}
            }
        )
    }
    
    fun cleanup() {
        peerConnection?.close()
        peerConnection = null
    }
}
```

---

## 🔧 API Reference

### Classe `SmaRTCSimple`

| Méthode | Description | Retour |
|---------|-------------|--------|
| `suspend fun login(username: String, password: String)` | Authentification utilisateur | `Unit` |
| `suspend fun register(username: String, password: String)` | Créer un compte | `User` |
| `suspend fun startCall(roomName: String)` | Créer un appel | `Session` |
| `suspend fun joinCall(sessionId: String)` | Rejoindre un appel existant | `Session` |
| `suspend fun endCall()` | Terminer l'appel en cours | `Unit` |
| `suspend fun getAvailableCalls()` | Liste des appels actifs | `List<Session>` |
| `suspend fun getICEServers()` | Configuration STUN/TURN | `List<ICEServer>` |
| `suspend fun logout()` | Déconnexion | `Unit` |

### Propriétés

```kotlin
val isLoggedIn: Boolean          // État de connexion
val currentUsername: String?     // Nom d'utilisateur actuel
val currentSessionId: String?    // ID de session active
```

---

## 🎨 Data Classes

### `SmaRTCConfig`

```kotlin
data class SmaRTCConfig(
    val apiBaseUrl: String = "http://10.0.2.2:8080",  // Émulateur Android
    val signalServerUrl: String = "http://10.0.2.2:5001",
    val timeout: Long = 10000L,  // 10 secondes
    val enableLogs: Boolean = false
)
```

### `Session`

```kotlin
@Serializable
data class Session(
    val sessionId: String,
    val roomName: String,
    val hostUserId: String,
    val participants: List<String> = emptyList(),
    val createdAt: String,
    val isActive: Boolean
)
```

### `User`

```kotlin
@Serializable
data class User(
    val id: String,
    val username: String
)
```

---

## ⚠️ Gestion des erreurs

### Exceptions disponibles

```kotlin
sealed class SmaRTCException(message: String) : Exception(message) {
    class AuthenticationError(message: String = "Identifiants incorrects") : SmaRTCException(message)
    class SessionNotFoundError(message: String = "Cet appel n'existe pas") : SmaRTCException(message)
    class NetworkError(message: String = "Problème de connexion") : SmaRTCException(message)
    class GenericError(message: String) : SmaRTCException(message)
}
```

### Exemple de gestion

```kotlin
try {
    client.login("alice", "password")
} catch (e: SmaRTCException.AuthenticationError) {
    // Identifiants invalides
    showError("Nom d'utilisateur ou mot de passe incorrect")
} catch (e: SmaRTCException.NetworkError) {
    // Problème réseau
    showError("Vérifiez votre connexion internet")
} catch (e: SmaRTCException) {
    // Erreur générique
    showError("Une erreur est survenue : ${e.message}")
}
```

---

## 🛠️ Troubleshooting

### Problème : `UnknownHostException` sur émulateur

**Solution** : L'émulateur Android utilise `10.0.2.2` pour accéder à `localhost` de votre machine.

```kotlin
val config = SmaRTCConfig(
    apiBaseUrl = "http://10.0.2.2:8080"  // ✅ Correct pour émulateur
)
```

Pour un appareil physique sur le même réseau :

```kotlin
val config = SmaRTCConfig(
    apiBaseUrl = "http://192.168.1.10:8080"  // IP locale de votre PC
)
```

---

### Problème : Crash avec `NetworkOnMainThreadException`

**Solution** : Toujours appeler les méthodes SDK dans une coroutine.

```kotlin
// ❌ INCORRECT
val session = client.startCall("Room")  // Crash !

// ✅ CORRECT
viewModelScope.launch {
    val session = client.startCall("Room")
}
```

---

### Problème : `ClearTextTrafficException` (Android 9+)

**Solution** : Autoriser HTTP en développement dans `AndroidManifest.xml` :

```xml
<application
    android:usesCleartextTraffic="true"
    ...>
```

Ou créer `res/xml/network_security_config.xml` :

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>
```

Référencer dans `AndroidManifest.xml` :

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

---

## 📚 Ressources

- [Documentation API REST complète](../../docs/README.md)
- [Exemple complet Android](./examples/QuickStart.kt)
- [WebRTC Android Guide](https://webrtc.org/getting-started/android)
- [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html)

---

## 🤝 Support

- **Issues GitHub** : [SmaRTC Issues](https://github.com/DeLTa-X-Tunisia/SmaRTC/issues)
- **Documentation** : [docs/](../../docs/)
- **Exemples** : [examples/](./examples/)

---

## 📄 Licence

MIT License – Développé par **DeLTa-X Tunisia** 🇹🇳

---

**🚀 Prêt à intégrer WebRTC dans votre app Android ? Start calling avec SmaRTC !**
