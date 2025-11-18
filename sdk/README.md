# 🚀 SmaRTC SDKs

Bienvenue dans l'écosystème des SDKs SmaRTC ! Cette collection vous permet d'intégrer facilement des fonctionnalités de visioconférence WebRTC dans vos applications.

## 📦 SDKs Disponibles

| SDK | Langage | Plateforme | Status | Utilisation |
|-----|---------|------------|--------|-------------|
| [**Flutter**](./flutter/) | Dart | Mobile (iOS/Android), Web | ✅ **Production Ready** | Apps cross-platform |
| [**JavaScript**](./js/) | JavaScript/TypeScript | Web, Node.js | 🚧 Beta | Web apps, PWA |
| [**C#**](./csharp/) | C# | .NET 6+, Unity | 🔄 En développement | Apps Windows, jeux |
| [**Swift**](./swift/) | Swift | iOS, macOS | 📋 Planifié | Apps Apple natives |

## ⚡ Quick Start (10 secondes)

### 🎯 Wrapper Simplifié (Recommandé pour débutants)

**Le wrapper réduit le code de 50% !** Parfait pour débuter rapidement.

```dart
// Flutter - Wrapper Simplifié (voir sdk/flutter/SIMPLE.md)
import 'package:smartc_sdk/smartc_simple.dart';

final smartc = SmaRTCSimple();
await smartc.login('demo', 'Demo123!');
await smartc.startCall('Mon appel');  // Crée + rejoint automatiquement !
```

```javascript
// JavaScript - Wrapper Simplifié (voir sdk/js/examples/simple-demo.html)
import { SmaRTCSimple } from './smartc-simple.js';

const smartc = new SmaRTCSimple();
await smartc.login('demo', 'Demo123!');
await smartc.startCall('Mon appel');  // Crée + rejoint automatiquement !
```

---

### 🔧 SDK Standard (Pour usage avancé)

```dart
// Flutter/Dart
import 'package:smartc_sdk/smartc_sdk.dart';

void main() async {
  // 1. Initialiser le SDK
  await SmaRTCClient.initialize(SmaRTCConfig(
    apiUrl: 'https://api.votre-domaine.com',
    signalServerUrl: 'https://signal.votre-domaine.com/signalhub',
  ));

  // 2. Se connecter
  await SmaRTCClient.instance.auth.login(
    username: 'user@example.com',
    password: 'motdepasse',
  );

  // 3. Créer une session
  final session = await SmaRTCClient.instance.sessions.createSession(
    name: 'Ma première session',
    description: 'Test de visioconférence',
  );

  print('Session créée : ${session.id}');
}
```

```javascript
// JavaScript/TypeScript
import { SmaRTCClient } from '@smartc/sdk';

async function quickStart() {
  // 1. Initialiser le SDK
  const client = new SmaRTCClient({
    apiUrl: 'https://api.votre-domaine.com',
    signalServerUrl: 'https://signal.votre-domaine.com/signalhub',
  });

  // 2. Se connecter
  await client.auth.login('user@example.com', 'motdepasse');

  // 3. Créer une session
  const session = await client.sessions.create({
    name: 'Ma première session',
    description: 'Test de visioconférence',
  });

  console.log('Session créée :', session.id);
}

quickStart();
```

```csharp
// C# (.NET)
using SmaRTC.SDK;

// 1. Initialiser le SDK
var client = new SmaRTCClient(new SmaRTCConfig
{
    ApiUrl = "https://api.votre-domaine.com",
    SignalServerUrl = "https://signal.votre-domaine.com/signalhub"
});

// 2. Se connecter
await client.Auth.LoginAsync("user@example.com", "motdepasse");

// 3. Créer une session
var session = await client.Sessions.CreateAsync(new CreateSessionRequest
{
    Name = "Ma première session",
    Description = "Test de visioconférence"
});

Console.WriteLine($"Session créée : {session.Id}");
```

## 🎯 Choisir le bon SDK

### 🦋 Flutter - **Recommandé pour le mobile**
- ✅ Une seule codebase pour iOS, Android et Web
- ✅ Hot reload ultra-rapide
- ✅ UI moderne avec Material Design
- 📱 **Cas d'usage** : Apps mobiles, PWA, apps desktop

👉 [**Commencer avec Flutter SDK**](./flutter/QUICKSTART.md)

---

### 🌐 JavaScript - **Recommandé pour le web**
- ✅ Intégration facile dans React, Vue, Angular
- ✅ Compatible TypeScript
- ✅ Léger et performant
- 🌍 **Cas d'usage** : Sites web, dashboards, web apps

👉 [**Commencer avec JavaScript SDK**](./js/README.md)

---

### ⚙️ C# - **Recommandé pour .NET & Unity**
- ✅ Typé et robuste
- ✅ Compatible Unity pour les jeux
- ✅ Intégration WPF/WinForms
- 🎮 **Cas d'usage** : Apps Windows, jeux, outils desktop

👉 [**Commencer avec C# SDK**](./csharp/README.md)

---

### 🍎 Swift - **Recommandé pour iOS natif**
- ✅ Performance native optimale
- ✅ Intégration parfaite avec UIKit/SwiftUI
- ✅ Support ARKit pour la réalité augmentée
- 📱 **Cas d'usage** : Apps iOS/macOS premium

👉 [**Commencer avec Swift SDK**](./swift/README.md)

---

## 🛠️ Fonctionnalités communes

Tous les SDKs partagent les mêmes fonctionnalités de base :

| Fonctionnalité | Description |
|----------------|-------------|
| **🔐 Authentification** | JWT avec refresh automatique |
| **📹 WebRTC** | Vidéo/audio peer-to-peer |
| **💬 SignalR** | Signalisation temps réel |
| **👥 Sessions** | Gestion des salles de conférence |
| **🎤 Contrôles** | Mute mic, disable camera, switch camera |
| **📊 Statistiques** | Qualité réseau, latence, packet loss |

## 📚 Documentation complète

- 📖 [**Architecture du système**](../docs/ARCHITECTURE.md)
- 🔧 [**Guide d'installation**](../docs/INSTALLATION.md)
- 🧪 [**Guide de test**](../docs/TESTING.md)
- 🐛 [**Troubleshooting**](../docs/TROUBLESHOOTING.md)
- 🔒 [**Sécurité**](../docs/SECURITY.md)

## 🤝 Support & Communauté

- 💬 [**Discord**](https://discord.gg/smartc) - Support en temps réel
- 📧 [**Email**](mailto:support@smartc.tn) - support@smartc.tn
- 🐛 [**Issues GitHub**](https://github.com/DeLTa-X-Tunisia/SmaRTC/issues) - Bugs & feature requests
- 📝 [**Blog**](https://blog.smartc.tn) - Tutoriels et updates

## 🚀 Déploiement

### Auto-hébergement (Docker)

```bash
# Cloner le repo
git clone https://github.com/DeLTa-X-Tunisia/SmaRTC.git
cd SmaRTC/deploy

# Configurer les variables d'environnement
cp .env.example .env
nano .env

# Démarrer les services
docker-compose up -d
```

### Cloud (Azure/AWS)

Consultez notre [**guide de déploiement cloud**](../docs/DEPLOYMENT.md).

## 📄 Licence

MIT License - voir [LICENSE](../LICENSE) pour plus de détails.

## 🌟 Contribuer

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](../CONTRIBUTING.md).

---

<div align="center">
  <strong>Made with ❤️ by DeLTa-X Tunisia</strong>
  <br>
  <sub>Propulsé par WebRTC, SignalR, et Flutter</sub>
</div>
