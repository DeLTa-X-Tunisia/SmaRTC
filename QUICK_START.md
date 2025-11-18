# 🚀 Guide de Démarrage Rapide - SmaRTC

**Temps estimé : 5 minutes** ⏱️

## 👋 Bienvenue !

Ce guide vous aidera à intégrer SmaRTC dans votre app en moins de 5 minutes.

## 📱 Choisissez votre plateforme

<details>
<summary><b>🎯 Flutter (Mobile/Web)</b></summary>

### 1. Installation

```yaml
# pubspec.yaml
dependencies:
  smartc_sdk: ^1.0.0
```

### 2. Importer

```dart
import 'package:smartc_sdk/smartc_simple.dart';
```

### 3. Utiliser (3 lignes !)

```dart
final smartc = SmaRTCSimple();
await smartc.login('demo', 'Demo123!');
await smartc.startCall('Mon premier appel');
```

### 4. Afficher la vidéo

```dart
CallScreen(
  localStream: smartc.localVideoStream,
  remoteStreams: smartc.remoteVideoStreams,
)
```

**👉 [Voir l'exemple complet](./sdk/flutter/SIMPLE.md)**

</details>

<details>
<summary><b>🌐 JavaScript (Web)</b></summary>

### 1. Installation

```html
<!-- Via CDN -->
<script type="module">
  import { SmaRTCSimple } from 'https://cdn.smartc.tn/smartc-simple.js';
</script>
```

### 2. Utiliser (3 lignes !)

```javascript
const smartc = new SmaRTCSimple();
await smartc.login('demo', 'Demo123!');
await smartc.startCall('Mon premier appel');
```

### 3. Afficher la vidéo

```javascript
smartc.onLocalStream((stream) => {
  document.getElementById('localVideo').srcObject = stream;
});

smartc.onRemoteStream((userId, stream) => {
  // Créer <video> pour chaque participant
});
```

**👉 [Voir l'exemple complet](./sdk/js/examples/simple-demo.html)**

</details>

<details>
<summary><b>🖥️ C# (.NET/Unity)</b></summary>

### 1. Installation

```bash
dotnet add package SmaRTCSDK
```

### 2. Utiliser

```csharp
using SmaRTC.SDK;

var client = new SmaRTCClient(config);
await client.Auth.LoginAsync("demo", "Demo123!");
var session = await client.Sessions.CreateAsync("Mon appel");
await client.WebRTC.JoinAsync(session.Id);
```

**👉 [Voir l'exemple complet](./sdk/csharp/README.md)**

</details>

<details>
<summary><b>🍎 Swift (iOS/macOS)</b></summary>

### 1. Installation (Swift Package Manager)

```swift
dependencies: [
    .package(url: "https://github.com/DeLTa-X-Tunisia/SmaRTC-Swift.git", from: "1.0.0")
]
```

### 2. Utiliser

```swift
import SmaRTCSDK

let client = SmaRTCClient(config: config)
try await client.auth.login(username: "demo", password: "Demo123!")
let session = try await client.sessions.create(name: "Mon appel")
try await client.webrtc.join(sessionId: session.id)
```

**👉 [Voir l'exemple complet](./sdk/swift/README.md)**

</details>

---

## 🎓 Tutoriel complet (15 min)

### Étape 1 : Créer un compte

```dart
// Flutter
await smartc.register('monusername', 'MonMotDePasse123!');
```

```javascript
// JavaScript
await smartc.register('monusername', 'MonMotDePasse123!');
```

### Étape 2 : Se connecter

```dart
// Flutter
await smartc.login('monusername', 'MonMotDePasse123!');
print('Connecté : ${smartc.currentUsername}');
```

```javascript
// JavaScript
await smartc.login('monusername', 'MonMotDePasse123!');
console.log('Connecté :', smartc.currentUsername);
```

### Étape 3 : Démarrer un appel

```dart
// Flutter
final sessionId = await smartc.startCall('Réunion d\'équipe');
print('Session créée : $sessionId');
```

```javascript
// JavaScript
const sessionId = await smartc.startCall('Réunion d\'équipe');
console.log('Session créée :', sessionId);
```

### Étape 4 : Gérer les contrôles

```dart
// Flutter
await smartc.toggleMicrophone();  // Mute/unmute
await smartc.toggleCamera();      // On/off caméra
await smartc.switchCamera();      // Avant/arrière
```

```javascript
// JavaScript
await smartc.toggleMicrophone();  // Mute/unmute
await smartc.toggleCamera();      // On/off caméra
```

### Étape 5 : Terminer l'appel

```dart
// Flutter
await smartc.endCall();
await smartc.logout();
```

```javascript
// JavaScript
await smartc.logout();  // Termine l'appel automatiquement
```

---

## 🔧 Configuration avancée

### Serveur personnalisé

```dart
// Flutter
await SmaRTCClient.initialize(SmaRTCConfig(
  apiUrl: 'https://api.votre-domaine.com',
  signalServerUrl: 'https://signal.votre-domaine.com/signalhub',
));

final smartc = SmaRTCSimple();
```

```javascript
// JavaScript
const smartc = new SmaRTCSimple({
  apiUrl: 'https://api.votre-domaine.com',
  signalServerUrl: 'https://signal.votre-domaine.com/signalhub'
});
```

### Serveurs TURN personnalisés

```dart
// Flutter
SmaRTCConfig(
  turnServers: [
    TurnServer(
      urls: 'turn:turn.votre-domaine.com:3478',
      username: 'user',
      credential: 'pass',
    ),
  ],
)
```

---

## ❌ Gestion des erreurs

```dart
// Flutter
try {
  await smartc.login('user', 'wrongpass');
} on SmaRTCSimpleError catch (e) {
  print('Erreur : ${e.message}');
  // "Identifiants incorrects"
}
```

```javascript
// JavaScript
try {
  await smartc.login('user', 'wrongpass');
} catch (error) {
  console.error('Erreur :', error.message);
  // "Identifiants incorrects"
}
```

**Messages d'erreur courants :**

| Erreur | Signification | Solution |
|--------|---------------|----------|
| `Identifiants incorrects` | Username/password invalide | Vérifier les identifiants |
| `Problème de connexion` | Serveur inaccessible | Vérifier l'URL du serveur |
| `Cet appel n'existe pas` | Session introuvable | Vérifier l'ID de session |
| `Erreur micro` | Permission refusée | Autoriser le micro dans les paramètres |
| `Erreur caméra` | Permission refusée | Autoriser la caméra dans les paramètres |

---

## 📖 Exemples prêts à l'emploi

### 1. Appel 1-to-1

```dart
// User A démarre
final sessionId = await smartc.startCall('Appel avec Bob');
// Envoyer sessionId à Bob via votre système de messagerie

// User B rejoint
await smartc.joinCall(sessionId);
```

### 2. Conférence de groupe

```dart
// Créer une salle d'attente
final sessions = await smartc.getAvailableCalls();

ListView.builder(
  itemCount: sessions.length,
  itemBuilder: (context, index) {
    return ListTile(
      title: Text(sessions[index].name),
      onTap: () => smartc.joinCall(sessions[index].id),
    );
  },
)
```

### 3. Streaming en direct

```dart
// Créateur du stream
await smartc.startCall('Live Stream', description: 'Concert en direct');

// Viewers rejoignent
final calls = await smartc.getAvailableCalls();
final liveStream = calls.firstWhere((c) => c.name == 'Live Stream');
await smartc.joinCall(liveStream.id);
```

---

## 🎯 Prochaines étapes

1. 📚 **Lire la doc complète** → [sdk/README.md](./sdk/README.md)
2. 🔍 **Explorer les exemples** → [sdk/*/examples/](./sdk/)
3. 🛠️ **Personnaliser l'UI** → Utiliser vos propres composants
4. 🚀 **Déployer** → Suivre [docs/deployment.md](./docs/)

---

## 💡 Tips & Astuces

### ✅ Bonnes pratiques

1. **Toujours gérer les erreurs** avec try/catch
2. **Appeler logout()** quand l'utilisateur quitte l'app
3. **Demander les permissions** caméra/micro avant de démarrer
4. **Tester sur plusieurs appareils** (mobile, desktop, web)

### ⚠️ Pièges courants

| Problème | Solution |
|----------|----------|
| Écran noir | Vérifier les permissions caméra |
| Pas de son | Vérifier les permissions micro |
| Connexion échoue | Vérifier l'URL du serveur |
| JWT expiré | Appeler `login()` à nouveau |

---

## 📞 Support

- 📧 Email: support@smartc.tn
- 💬 Discord: [discord.gg/smartc](https://discord.gg/smartc)
- 📖 Docs: [docs.smartc.tn](https://docs.smartc.tn)
- 🐛 Issues: [GitHub Issues](https://github.com/DeLTa-X-Tunisia/SmaRTC/issues)

---

**Made with ❤️ by DeLTa-X Tunisia**

*Temps total : 5 minutes ⏱️ | Difficulté : ⭐️☆☆☆☆*
