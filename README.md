<div align="center">

# 📡 SmaRTC
<p align="center">
  <img src="https://img.shields.io/badge/Author-Azizi%20Mounir-blue?style=for-the-badge" alt="Author: Azizi Mounir">
  <img src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg" alt="Flag of Tunisia" width="60" height="40">
  <img src="https://img.shields.io/badge/Phone-%2B216%2027%20774%20075-006400?style=for-the-badge" alt="Phone: +21627774075">
</p>

### *Smart Real-Time Communication — Built for Today, Styled Like Yesterday*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-00D084?logo=webrtc)](https://webrtc.org/)
[![SignalR](https://img.shields.io/badge/SignalR-Real--Time-8A2BE2?logo=microsoft)](https://dotnet.microsoft.com/apps/aspnet/signalr)

![SDKs disponibles](https://img.shields.io/badge/SDKs-10%20langages%20supportés-blueviolet?style=for-the-badge)
![Code simplifié](https://img.shields.io/badge/Code-50%25%20plus%20court-brightgreen?style=for-the-badge)
[![Multi-Language SDKs](https://img.shields.io/badge/SDKs-Python%20%7C%20TypeScript%20%7C%20Kotlin%20%7C%20Go%20%7C%20Rust%20%7C%20Java-ff69b4?style=for-the-badge)](sdk/README.md)

[![Bugs Squashed](https://img.shields.io/badge/Bugs%20Squashed-∞-success?logo=github)](docs/troubleshooting.md)
[![Coffee Consumed](https://img.shields.io/badge/Coffee%20Consumed-%E2%98%95%20%E2%98%95%20%E2%98%95-brown)](https://en.wikipedia.org/wiki/Coffee)
[![Code Quality](https://img.shields.io/badge/Code%20Quality-Chef's%20Kiss-ff69b4?logo=chef)](https://github.com/DeLTa-X-Tunisia/SmaRTC)

---

**SmaRTC** is a production-ready, fully containerized WebRTC platform that brings the power of real-time video and audio communication to your fingertips. Built with .NET 9, SignalR, and a touch of retro charm, it's the platform that bridges cutting-edge tech with a nostalgic nod to simpler times.

Whether you're building a video conferencing app, a collaborative workspace, or just want to flex your WebRTC muscles, SmaRTC has you covered.

</div>

---

## ✨ Features That Spark Joy

- 🔐 **JWT Authentication** — Secure, claim-based auth with zero compromise. Your tokens, your rules.
- 📞 **WebRTC Signaling** — Lightning-fast peer negotiation via SignalR. Because latency is *so* 2015.
- 🎥 **Session Management** — Create, join, and manage communication sessions with a clean RESTful API.
- 🌐 **STUN/TURN Server** — Integrated Coturn for NAT traversal. Even firewalls can't stop you.
- 🐳 **Docker-First** — 12 microservices, one command. `docker compose up` and you're live.
- 📚 **Client SDKs** — 10 langages supportés : Python, TypeScript, Kotlin, Go, Rust, Java, Flutter, JavaScript, C#, Swift.
- 📱 **Flutter SDK** — Complete native mobile SDK with pre-built UI components for video calls.
- ⚡ **50% Code Reduction** — Wrappers simplifiés réduisent le code de moitié pour un démarrage ultra-rapide.
- 🧪 **Battle-Tested** — End-to-end test suite included. Every endpoint validated, every claim verified.

---

## 🚀 Quick Start

### Prerequisites

- **Docker** & **Docker Compose** (v2.0+)
- **PowerShell** (for the test script)
- A sense of adventure 🧭

### 1. Clone & Navigate

```bash
git clone https://github.com/DeLTa-X-Tunisia/SmaRTC.git
cd SmaRTC
```

### 2. Launch the Platform

```bash
docker compose -f deploy/docker-compose.yml up -d
```

This spins up 12 services:
- API server (`:8080`)
- Signal server (`:5001`)
- PostgreSQL database
- Redis cache
- Coturn (STUN/TURN)
- Nginx reverse proxy
- Prometheus + Grafana (monitoring)
- Janus media server

### 3. Verify the Deployment

```powershell
.\test-api.ps1
```

If you see **"All tests passed successfully"**, you're golden. 🏆

---

## 🏗️ Architecture Overview

SmaRTC is built on a microservices architecture, with each component handling a specific domain.

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Client    │─────▶│    Nginx     │─────▶│   API       │
│ (Browser)   │      │ (Port 8080)  │      │ (.NET 9)    │
└─────────────┘      └──────────────┘      └─────────────┘
                              │                     │
                              │                     ▼
                              │             ┌─────────────┐
                              │             │ PostgreSQL  │
                              │             │  Database   │
                              │             └─────────────┘
                              │
                              ▼
                     ┌──────────────┐       ┌─────────────┐
                     │ Signal Server│◀─────▶│   Redis     │
                     │  (SignalR)   │       │   Cache     │
                     └──────────────┘       └─────────────┘
                              │
                              ▼
                     ┌──────────────┐
                     │    Coturn    │
                     │ (STUN/TURN)  │
                     └──────────────┘
```

### Key Components

| Component | Purpose | Tech Stack |
|-----------|---------|------------|
| **API** | RESTful backend for auth, sessions, and media | ASP.NET Core 9, EF Core |
| **Signal Server** | WebRTC signaling via WebSockets | SignalR, .NET 9 |
| **Database** | Persistent storage for users and sessions | PostgreSQL 17 |
| **Cache** | Session state and real-time data | Redis 7 |
| **STUN/TURN** | NAT traversal for peer connections | Coturn |
| **Nginx** | Reverse proxy and load balancer | Nginx 1.25 |
| **Monitoring** | Metrics and dashboards | Prometheus + Grafana |

---

## 🔑 Authentication Flow

SmaRTC uses JWT Bearer tokens with claim-based authorization. Here's how it works:

1. **Register** (`POST /api/auth/register`) — Create a new user account.
2. **Login** (`POST /api/auth/login`) — Receive a JWT token with `sub` and `NameIdentifier` claims set to your user ID.
3. **Authenticate** — Include the token in the `Authorization: Bearer <token>` header for protected endpoints.
4. **Create Sessions** — The `SessionController` reads your user ID from the `NameIdentifier` claim and associates it with the session.

> **Technical Deep Dive:** Read about the [JWT claim resolution journey](docs/auth-claims.md) that made this rock-solid.

---

## 📋 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Login and receive JWT token | ❌ |

### Sessions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/session` | Create a new session | ✅ |
| `GET` | `/api/session` | Get all sessions | ✅ |
| `GET` | `/api/session/{id}` | Get a specific session | ✅ |
| `DELETE` | `/api/session/{id}` | Delete a session | ✅ |

### WebRTC

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/webrtc/ice` | Get ICE server configuration | ✅ |

### Admin

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/admin/users` | Get all users (admin only) | ✅ |

---

## 🧪 Testing

The platform includes a comprehensive PowerShell test script that validates the entire API surface.

```powershell
.\test-api.ps1
```

**What it tests:**
- Health checks
- User registration and login
- JWT token generation and validation
- Session CRUD operations
- ICE server configuration retrieval

📊 **[View the full test report](docs/test-report.md)**

---

## 📚 SDKs Multi-Langages

**SmaRTC propose 10 SDKs production-ready** couvrant tous les cas d'usage, du mobile au backend enterprise.

| Langage | Plateforme | Status | Quick Start | Documentation |
|---------|------------|--------|-------------|---------------|
| **Python** 🐍 | Backend, IA, Bots | ✅ Production | [quick_start.py](sdk/python/examples/quick_start.py) | [README](sdk/python/README.md) |
| **TypeScript** 📘 | Web (React/Vue/Angular) | ✅ Production | [Voir README](sdk/typescript/README.md) | [README](sdk/typescript/README.md) |
| **Kotlin** 📱 | Android natif | ✅ Production | [QuickStart.kt](sdk/kotlin/examples/QuickStart.kt) | [README](sdk/kotlin/README.md) |
| **Go** 🚀 | Backend, Microservices | ✅ Production | [quick_start.go](sdk/go/examples/quick_start.go) | [README](sdk/go/README.md) |
| **Rust** 🦀 | Native, Performance | ✅ Production | [quick_start.rs](sdk/rust/examples/quick_start.rs) | [README](sdk/rust/README.md) |
| **Java** ☕ | Enterprise, Android | ✅ Production | [QuickStart.java](sdk/java/examples/QuickStart.java) | [README](sdk/java/README.md) |
| **Flutter** 🎯 | iOS/Android/Web | ✅ Production | [exemple](sdk/flutter/example/) | [README](sdk/flutter/README.md) |
| **JavaScript** 🟨 | Web, Node.js | ✅ Production | [simple-demo.html](sdk/js/examples/simple-demo.html) | [README](sdk/js/README.md) |
| **C#** 💜 | .NET, Unity | 🔄 En cours | - | [README](sdk/csharp/README.md) |
| **Swift** 🍎 | iOS, macOS | 📋 Planifié | - | - |

### 🎯 Quick Start Exemple (3 lignes de code)

**Python** 🐍
```python
client = SmaRTCSimple()
await client.login("alice", "password123")
session = await client.startCall("Réunion Backend")
```

**TypeScript** 📘
```typescript
const client = new SmaRTCSimple();
await client.login("alice", "password123");
const session = await client.startCall("Réunion Web");
```

**Go** 🚀
```go
client := smartc.NewClient(nil)
client.Login("alice", "password123")
session, _ := client.StartCall("Réunion Backend")
```

**Rust** 🦀
```rust
let mut client = SmaRTCClient::new(None);
client.login("alice", "password123").await?;
let session = client.start_call("Réunion Native").await?;
```

**Java** ☕
```java
SmaRTCClient client = new SmaRTCClient();
client.login("alice", "password123").join();
Session session = client.startCall("Réunion Enterprise").join();
```

**Kotlin** 📱
```kotlin
val client = SmaRTCSimple()
client.login("alice", "password123")
val session = client.startCall("Réunion Android")
```

### 📦 Cas d'usage couverts

| Use Case | SDKs Recommandés |
|----------|------------------|
| 🤖 **Bots & Automatisation** | Python, Go |
| 🌐 **Applications Web** | TypeScript (React/Vue/Angular), JavaScript |
| 📱 **Mobile Natif** | Flutter (cross-platform), Kotlin (Android), Swift (iOS) |
| 🏢 **Backend Enterprise** | Java (Spring Boot), C#, Go |
| 🚀 **Microservices** | Go, Rust |
| 🧪 **Prototypage Rapide** | Python, TypeScript |
| 🔒 **Performance & Sécurité** | Rust, Go |

**📖 [Documentation complète des SDKs](sdk/README.md)**

---

## 📖 Documentation

### 🚀 Pour les Développeurs

**Nouveau !** Documentation simplifiée pour une intégration rapide :

- 🎯 **[Quick Start (5 min)](QUICK_START.md)** — Guide ultra-rapide pour débuter
- 📦 **[Vue d'ensemble SDKs](sdk/README.md)** — Comparaison Dart/JS/C#/Swift
- 📋 **[Nouveautés SDK](SDK_IMPROVEMENTS.md)** — Wrappers, exemples, statistiques
- 🎨 **[Wrapper Flutter](sdk/flutter/SIMPLE.md)** — API simplifiée pour Flutter
- 🌐 **[SDK JavaScript](sdk/js/README.md)** — React, Vue, vanilla JS
- 🖥️ **[SDK C#](sdk/csharp/README.md)** — WPF, Unity, .NET
- 🍎 **[SDK Swift](sdk/swift/README.md)** — iOS, macOS

### 📚 Documentation Plateforme

Plongez dans les détails techniques de la plateforme :

- **[Getting Started](docs/docker-startup.md)** — Step-by-step setup guide
- **[Development Guide](docs/development-guide.md)** — Best practices, migrations, and conventions
- **[Authentication & Claims](docs/auth-claims.md)** — The JWT claim resolution story
- **[Troubleshooting](docs/troubleshooting.md)** — Common issues and solutions
- **[Test Report](docs/test-report.md)** — Full test suite validation

---

## 🚀 SDK Simplifié – Nouveautés ✨

**SmaRTC est maintenant ultra-simple à intégrer !** Nous avons créé des **wrappers simplifiés** qui réduisent le code de **50%** 🎉

### 🎯 Avant vs Après

<table>
<tr>
<td width="50%">

**Avant (SDK Standard)**
```dart
await SmaRTCClient.initialize(...);
await SmaRTCClient.instance.auth.login(
  username: "demo", 
  password: "pass"
);
final session = await SmaRTCClient
  .instance.sessions.createSession(
    name: "Call"
  );
await SmaRTCClient.instance.webrtc
  .joinSession(session.id);
```

</td>
<td width="50%">

**Après (Wrapper Simple)**
```dart
final smartc = SmaRTCSimple();
await smartc.login('demo', 'pass');
await smartc.startCall('Call');
// ✅ Crée + rejoint auto !
```

</td>
</tr>
</table>

### 📦 Wrappers Disponibles

| Langage | Fichier | Quick Start | Documentation |
|---------|---------|-------------|---------------|
| **Dart/Flutter** | [`smartc_simple.dart`](sdk/flutter/lib/smartc_simple.dart) | [Exemple](sdk/flutter/example/lib/quick_start.dart) | [SIMPLE.md](sdk/flutter/SIMPLE.md) |
| **JavaScript** | [`smartc-simple.js`](sdk/js/smartc-simple.js) | [Démo Live](sdk/js/examples/simple-demo.html) | [README.md](sdk/js/README.md) |
| **C#** | *(en cours)* | [Exemple WPF](sdk/csharp/README.md#wpf) | [README.md](sdk/csharp/README.md) |
| **Swift** | *(en cours)* | [Exemple SwiftUI](sdk/swift/examples/QuickStart.swift) | [README.md](sdk/swift/README.md) |

### ⚡ Fonctionnalités Clés

- ✅ **Méthodes simplifiées** : `startCall()`, `joinCall()`, `endCall()` au lieu de multiples appels
- ✅ **Erreurs en français** : "Identifiants incorrects", "Cet appel n'existe pas", etc.
- ✅ **Auto-gestion** : Garde trace de la session courante automatiquement
- ✅ **Fallback STUN** : Utilise Google STUN si pas de serveur TURN configuré
- ✅ **Zéro config** : Fonctionne out-of-the-box avec des valeurs par défaut sensées

### 🎓 Démarrage Rapide (5 minutes)

```bash
# 1. Lire le guide complet
cat QUICK_START.md

# 2. Voir les améliorations
cat SDK_IMPROVEMENTS.md

# 3. Choisir votre langage
cd sdk/flutter  # ou js, csharp, swift
```

**📚 Documentation complète :**
- 🚀 **[Guide de démarrage rapide](QUICK_START.md)** — 5 minutes pour être opérationnel
- 📦 **[Vue d'ensemble des SDKs](sdk/README.md)** — Comparaison et choix du bon SDK
- 📋 **[Améliorations détaillées](SDK_IMPROVEMENTS.md)** — Récapitulatif des nouveautés

### 💡 Exemples Minimalistes

**Flutter (3 lignes)**
```dart
final smartc = SmaRTCSimple();
await smartc.login('demo', 'Demo123!');
await smartc.startCall('Mon appel');
```

**JavaScript (3 lignes)**
```javascript
const smartc = new SmaRTCSimple();
await smartc.login('demo', 'Demo123!');
await smartc.startCall('Mon appel');
```

**C# (4 lignes)**
```csharp
var client = new SmaRTCClient(config);
await client.Auth.LoginAsync("demo", "Demo123!");
var session = await client.Sessions.CreateAsync("Mon appel");
await client.WebRTC.JoinAsync(session.Id);
```

---

## 📱 Flutter SDK (Production Ready)

SmaRTC inclut un **SDK Flutter complet** pour créer des apps de visioconférence natives !

### Features
- 🎨 **Composants UI prêts** — CallScreen, PreviewScreen, widgets vidéo
- 📞 **WebRTC intégré** — Support complet peer-to-peer
- 🔐 **Auth JWT** — Authentification seamless avec le backend
- 🎥 **Gestion sessions** — Création et participation facilitées
- 📡 **SignalR** — Signaling temps-réel intégré
- 📱 **Multi-plateforme** — Android, iOS, et Web

### Quick Start (Standard)

```dart
// Initialize the SDK
await SmaRTCClient.initialize(
  SmaRTCConfig(
    apiUrl: 'http://localhost:8080',
    signalServerUrl: 'http://localhost:5001/signalhub',
  ),
);

// Login
await SmaRTCClient.instance.auth.login(
  username: 'john_doe',
  password: 'password',
);

// Join a call
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => CallScreen(sessionId: 1),
  ),
);
```

📚 **[Documentation Flutter complète →](sdk/flutter/README.md)**  
🚀 **[Wrapper simplifié Flutter →](sdk/flutter/SIMPLE.md)**

---

## 🛠️ Built With

### Backend
- **[.NET 9](https://dotnet.microsoft.com/)** — The backend framework that keeps on giving
- **[ASP.NET Core](https://docs.microsoft.com/aspnet/core)** — RESTful APIs made easy
- **[Entity Framework Core](https://docs.microsoft.com/ef/core/)** — ORM with migrations
- **[SignalR](https://dotnet.microsoft.com/apps/aspnet/signalr)** — Real-time WebSocket magic
- **[PostgreSQL](https://www.postgresql.org/)** — Battle-tested relational database
- **[Redis](https://redis.io/)** — Blazing-fast in-memory cache
- **[Docker](https://www.docker.com/)** — Containerization for the win
- **[Coturn](https://github.com/coturn/coturn)** — STUN/TURN server for NAT traversal

### Client SDKs
- **[Flutter](https://flutter.dev/)** — Beautiful native apps (Dart)
- **[flutter_webrtc](https://pub.dev/packages/flutter_webrtc)** — WebRTC for Flutter
- **[signalr_netcore](https://pub.dev/packages/signalr_netcore)** — SignalR client
- **[Provider](https://pub.dev/packages/provider)** — State management
- **JavaScript/TypeScript** — Web, React, Vue, Node.js
- **C# / .NET** — Desktop apps, Unity games
- **Swift** — iOS and macOS native apps

---

## 📜 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## 🏆 Hall of Fame

This project was built with precision, debugged with patience, and deployed with pride.

**Special thanks to:**
- The .NET team for an amazing framework
- The WebRTC community for pushing the boundaries
- Coffee, for obvious reasons ☕

---

<div align="center">

**Made with 💙 by [DeLTa-X-Tunisia](https://github.com/DeLTa-X-Tunisia)**

*Smart tech. Retro vibes. Zero compromises.*

⭐ **Star this repo** if SmaRTC helped you build something cool!

</div>
---


