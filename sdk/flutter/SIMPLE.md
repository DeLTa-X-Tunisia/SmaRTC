# 🚀 Wrapper Simplifié SmaRTC

API ultra-simple pour intégrer SmaRTC en quelques lignes de code.

## ✨ Avantages

- ✅ **Méthodes simplifiées** : `startCall()` au lieu de `sessions.createSession()` puis `webrtc.joinSession()`
- ✅ **Erreurs explicites** : Messages d'erreur en français, compréhensibles
- ✅ **Auto-gestion** : Gère automatiquement la session courante
- ✅ **Zéro configuration** : Fallback automatique sur Google STUN

## 📦 Installation

```dart
import 'package:smartc_sdk/smartc_simple.dart';
```

## 🎯 Exemple complet (15 lignes)

```dart
import 'package:smartc_sdk/smartc_simple.dart';

final smartc = SmaRTCSimple();

// 1. Se connecter
await smartc.login('demo', 'Demo123!');

// 2. Démarrer un appel (crée + rejoint automatiquement)
final sessionId = await smartc.startCall('Mon appel');

// 3. Afficher les vidéos
CallScreen(
  localStream: smartc.localVideoStream,
  remoteStreams: smartc.remoteVideoStreams,
);

// 4. Contrôles
await smartc.toggleMicrophone();  // Mute/unmute
await smartc.toggleCamera();      // On/off caméra
await smartc.switchCamera();      // Avant/arrière

// 5. Terminer l'appel
await smartc.endCall();
await smartc.logout();
```

## 📚 API Reference

### Authentification

```dart
// Se connecter
await smartc.login('username', 'password');

// S'inscrire
await smartc.register('username', 'password', role: 'User');

// Se déconnecter (termine l'appel automatiquement)
await smartc.logout();

// Vérifier si connecté
if (smartc.isLoggedIn) { ... }

// Récupérer le username
String? username = smartc.currentUsername;
```

### Appels vidéo

```dart
// Démarrer un appel (crée + rejoint auto)
int sessionId = await smartc.startCall('Nom de l'appel', description: 'Optionnel');

// Rejoindre un appel existant
await smartc.joinCall(sessionId);

// Terminer l'appel
await smartc.endCall();

// Contrôles
await smartc.toggleMicrophone();  // Mute/unmute
await smartc.toggleCamera();      // On/off
await smartc.switchCamera();      // Avant/arrière
```

### Sessions

```dart
// Lister tous les appels disponibles
List<Session> calls = await smartc.getAvailableCalls();

// Récupérer les détails d'un appel
Session details = await smartc.getCallDetails(sessionId);
```

### Vidéos

```dart
// Flux vidéo local (peut être null)
MediaStream? localVideo = smartc.localVideoStream;

// Stream de changements du flux local
smartc.localStreamChanges.listen((stream) {
  // Mis à jour quand la caméra démarre/arrête
});

// Map des flux distants
Map<String, MediaStream> remotes = smartc.remoteVideoStreams;

// Stream des événements de flux distants
smartc.remoteStreamEvents.listen((event) {
  print('${event.username} ${event.isAdded ? "joined" : "left"}');
});

// Stream des participants qui quittent
smartc.participantLeftEvents.listen((username) {
  print('$username a quitté l\'appel');
});
```

### Réseau

```dart
// Récupérer les serveurs ICE (avec fallback Google STUN)
List<Map<String, dynamic>> iceServers = smartc.getIceServers();
```

## ❌ Gestion des erreurs

```dart
try {
  await smartc.login('user', 'pass');
} on SmaRTCSimpleError catch (e) {
  print(e.message);  // Message en français
  print(e.original); // Erreur originale (pour debug)
}
```

**Types d'erreurs :**

| Erreur | Raison |
|--------|--------|
| `Identifiants incorrects` | Username/password invalide |
| `Problème de connexion` | Serveur inaccessible |
| `Ce nom d'utilisateur existe déjà` | Inscription impossible |
| `Impossible de créer l'appel` | Erreur de session |
| `Cet appel n'existe pas` | Session non trouvée |
| `Erreur micro` | Problème d'accès au micro |
| `Erreur caméra` | Problème d'accès à la caméra |

## 🆚 Comparaison SDK Standard vs Simple

### SDK Standard (verbose)

```dart
final client = SmaRTCClient.instance;

// Login
await client.auth.login(username: 'demo', password: 'Demo123!');

// Créer session
final session = await client.sessions.createSession(
  name: 'Mon appel',
  description: 'Description'
);

// Rejoindre
await client.webrtc.joinSession(session.id);

// Mute
await client.webrtc.toggleMicrophone();

// Terminer
await client.webrtc.leaveSession();
await client.auth.logout();
```

### SDK Simple (concis)

```dart
final smartc = SmaRTCSimple();

// Login
await smartc.login('demo', 'Demo123!');

// Démarrer appel (crée + rejoint)
await smartc.startCall('Mon appel', description: 'Description');

// Mute
await smartc.toggleMicrophone();

// Terminer
await smartc.logout();  // Termine l'appel automatiquement
```

**Résultat : -50% de lignes de code !** 🎉

## 💡 Cas d'usage

### 1. Appel rapide entre 2 personnes

```dart
// Utilisateur A
await smartc.login('alice', 'pass');
final sessionId = await smartc.startCall('Appel avec Bob');
print('SessionId: $sessionId');  // Envoie à Bob

// Utilisateur B
await smartc.login('bob', 'pass');
await smartc.joinCall(sessionId);  // Rejoint avec l'ID
```

### 2. Conférence avec contrôles

```dart
await smartc.startCall('Réunion d\'équipe');

// UI avec boutons
IconButton(
  icon: Icon(Icons.mic_off),
  onPressed: () => smartc.toggleMicrophone(),
)

IconButton(
  icon: Icon(Icons.videocam_off),
  onPressed: () => smartc.toggleCamera(),
)

IconButton(
  icon: Icon(Icons.cameraswitch),
  onPressed: () => smartc.switchCamera(),
)
```

### 3. Rejoindre un appel depuis une liste

```dart
// Lister les appels
final calls = await smartc.getAvailableCalls();

// Afficher dans une liste
ListView.builder(
  itemCount: calls.length,
  itemBuilder: (context, index) {
    final call = calls[index];
    return ListTile(
      title: Text(call.name),
      subtitle: Text(call.description ?? ''),
      onTap: () => smartc.joinCall(call.id),
    );
  },
);
```

## 🔄 Migration SDK Standard → Simple

| Standard | Simple |
|----------|--------|
| `client.auth.login(username:, password:)` | `smartc.login(username, password)` |
| `client.sessions.createSession(name:)` | `smartc.startCall(name)` |
| `client.webrtc.joinSession(id)` | `smartc.joinCall(id)` |
| `client.webrtc.toggleMicrophone()` | `smartc.toggleMicrophone()` |
| `client.webrtc.leaveSession()` | `smartc.endCall()` |
| `client.auth.logout()` | `smartc.logout()` |
| `client.sessions.getSessions()` | `smartc.getAvailableCalls()` |

## ⚙️ Configuration avancée

Le wrapper utilise automatiquement la configuration du `SmaRTCClient` sous-jacent.

Si besoin de personnaliser :

```dart
// Initialiser le client standard avec config
await SmaRTCClient.initialize(SmaRTCConfig(
  apiUrl: 'https://api.votre-domaine.com',
  signalServerUrl: 'https://signal.votre-domaine.com/signalhub',
  stunServers: ['stun:stun.custom.com:3478'],
));

// Utiliser le wrapper simple ensuite
final smartc = SmaRTCSimple();
await smartc.login('user', 'pass');
```

## 📄 Licence

MIT License - voir [LICENSE](../../LICENSE)

---

**Made with ❤️ by DeLTa-X Tunisia**
