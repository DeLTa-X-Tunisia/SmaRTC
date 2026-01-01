<div align="center">

# SmaRTC - Smart Real-Time Communication Platform 🚀



  <img src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg" 
       alt="Drapeau Tunisien" width="150" height="150" />

  <p><strong>Plateforme WebRTC complète avec signalisation, STUN/TURN et outils de développement 2026</strong></p>

  [![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
  [![Demo Only](https://img.shields.io/badge/⚠️-Demo%20Only-orange.svg)](NOTICE)
  [![.NET](https://img.shields.io/badge/.NET-9.0-512BD4)](https://dotnet.microsoft.com/)
  [![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)
  [![SignalR](https://img.shields.io/badge/SignalR-Real--time-purple)](https://learn.microsoft.com/aspnet/signalr/)

</div>

---

## 🎯 Qu'est-ce que SmaRTC ?

**SmaRTC** (Smart Real-Time Communication) est une plateforme open-source complète pour les communications temps réel basée sur **WebRTC**. Elle permet de créer facilement des applications de :

- 📹 **Visioconférence** : Appels vidéo haute qualité entre plusieurs participants
- 📞 **Appels audio** : Communications vocales peer-to-peer ou en groupe
- 💬 **Messagerie instantanée** : Chat en temps réel avec synchronisation
- 📺 **Partage d'écran** : Diffusion de contenu en direct
- 📁 **Transfert de fichiers** : Échange de données peer-to-peer sécurisé

### 🌟 Pourquoi SmaRTC ?

| Avantage | Description |
|----------|-------------|
| 🎯 **Portfolio** | Projet de démonstration technique - Tous droits réservés |
| 🏗️ **Architecture complète** | Tout inclus : API, signalisation, STUN/TURN, monitoring |
| 🌐 **Multi-plateforme** | SDKs pour C#, JavaScript, Flutter, Python, Rust, Swift, Kotlin |
| 🐳 **Docker Ready** | Déploiement en une commande avec Docker Compose |
| 🔒 **Sécurisé** | Authentification JWT, chiffrement end-to-end WebRTC |
| 📊 **Monitoring intégré** | Grafana + Prometheus pour la supervision |
| ⚡ **Performant** | Optimisé pour la latence minimale et haute disponibilité |

### 🔧 Cas d'utilisation

- **Télémédecine** : Consultations médicales à distance
- **E-learning** : Classes virtuelles et tutoriels en direct
- **Support client** : Assistance vidéo en temps réel
- **Collaboration** : Réunions d'équipe et travail à distance
- **Gaming** : Chat vocal pour jeux multijoueurs
- **IoT** : Streaming vidéo depuis des appareils connectés

---

## 📁 Structure du Workspace

```
SmaRTC/                          ← Dépôt racine
│
├── 📂 SmaRTC-core/              ← Projet principal (serveurs, API, SDK)
│   ├── api/                     → API REST (.NET 9)
│   ├── signal-server/           → Serveur de signalisation SignalR
│   ├── deploy/                  → Configuration Docker Compose
│   ├── sdk/                     → SDKs multi-langages
│   │   ├── csharp/              → SDK C#
│   │   ├── javascript-mesh/     → SDK JavaScript
│   │   ├── flutter/             → SDK Flutter/Dart
│   │   ├── python/              → SDK Python
│   │   └── rust/                → SDK Rust
│   ├── database/                → Scripts SQL PostgreSQL
│   ├── stun-turn/               → Configuration Coturn
│   └── docs/                    → Documentation technique
│
├── 📂 C#/                       ← Exemples et outils C#
│   ├── Exemple_csharp/          → Application console de démonstration
│   └── Luncher_csharp/          → Launcher WPF pour les exemples
│
├── 📂 Flutter/                  ← Exemples Flutter
│   ├── Exemple_flutter/         → Application Flutter de chat
│   └── Luncher_flutter/         → Launcher C# pour Flutter
│
├── 📂 TypeScript/               ← Exemples TypeScript
│   ├── Exemple_TypeScript/      → Application web Node.js + Express
│   └── Luncher_TypeScript/      → Launcher WPF C#
│
├── 📂 Python/                   ← Exemples Python
│   ├── Exemple_Python/          → Application console colorée
│   └── Luncher_Python/          → Launcher WPF multi-clients
│
├── 📂 Go/                       ← Exemples Go
│   ├── Exemple_Go/              → Application console SignalR
│   └── Luncher_Go/              → Launcher WPF multi-clients
│
├── 📂 Rust/                     ← Exemples Rust
│   ├── Exemple_Rust/            → Application console performante
│   └── Luncher_Rust/            → Launcher WPF multi-clients
│
└── 📂 SmaRTC.Service_Launcher/  ← Launcher principal pour Docker
```

---

## 🎯 Composants

### 🔵 SmaRTC-core
Le cœur de la plateforme WebRTC :
- **API REST** : Gestion des utilisateurs, sessions, authentification JWT
- **Signal Server** : Hub SignalR pour la signalisation WebRTC temps réel
- **Infrastructure Docker** : 9 services orchestrés (PostgreSQL, Redis, Nginx, Coturn, Janus, Grafana, Prometheus)

### 🟢 C# - Exemples SDK ✅ Prêt
Démonstration du SDK C# avec :
- **Exemple_csharp** : Application console interactive de chat temps réel
- **Luncher_csharp** : Interface WPF pour lancer plusieurs clients simultanément

### 🎯 Flutter - Exemples SDK ✅ Prêt
Application Flutter moderne avec :
- **Exemple_flutter** : Application de chat avec interface Material 3, synchronisation temps réel multi-clients
- **Luncher_flutter** : Launcher C# avec Hot Reload/Restart, sélection de device, copie des logs

### 📘 TypeScript - Exemples SDK ✅ Prêt
Application web Node.js avec :
- **Exemple_TypeScript** : App web chat Express + SignalR, interface moderne responsive
- **Luncher_TypeScript** : Launcher WPF avec npm install/build/start automatiques
### 🐍 Python - Exemples SDK ✅ Prêt
Application console Python avec :
- **Exemple_Python** : Chat console coloré avec asyncio + SignalR
- **Luncher_Python** : Launcher WPF multi-clients, pip install automatique

### 🐹 Go - Exemples SDK ✅ Prêt
Application Go performante avec :
- **Exemple_Go** : Chat console avec goroutines + SignalR client
- **Luncher_Go** : Launcher WPF multi-clients, go mod tidy/build automatiques

### 🦀 Rust - Exemples SDK ✅ Prêt
Application Rust ultra-performante avec :
- **Exemple_Rust** : Chat console avec tokio + colored output
- **Luncher_Rust** : Launcher WPF multi-clients, cargo build automatique
### �🟣 SmaRTC.Service_Launcher
Application WPF moderne pour :
- Démarrer/arrêter les services Docker
- Surveiller l'état des conteneurs en temps réel
- Ouvrir les interfaces web (Swagger, Grafana, etc.)

---

## 🚀 Démarrage Rapide

### Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Flutter SDK](https://docs.flutter.dev/get-started/install) (optionnel, pour l'exemple Flutter)

### 1️⃣ Lancer les services Docker

```bash
cd SmaRTC-core/deploy
docker-compose up -d
```

Ou utilisez **SmaRTC.Service_Launcher** :
```bash
cd SmaRTC.Service_Launcher
dotnet run
```

### 2️⃣ Vérifier les services

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:8080/swagger | Documentation Swagger |
| Signal Hub | http://localhost:5001/signalhub | Hub SignalR |
| Grafana | http://localhost:3000 | Monitoring (admin/admin) |
| Prometheus | http://localhost:9090 | Métriques |

### 3️⃣ Tester le SDK C#

```bash
cd C#/Exemple_csharp
dotnet run
```

Ou lancez plusieurs clients avec :
```bash
cd C#/Luncher_csharp
dotnet run
```

### 4️⃣ Tester l'exemple Flutter

```bash
cd Flutter/Exemple_flutter
flutter pub get
flutter run -d chrome
```

Ou utilisez le launcher :
```bash
cd Flutter/Luncher_flutter
dotnet run
```

---

## 🔧 Configuration

### Base de données PostgreSQL
```
Host: localhost:5432
Database: SmaRTC
User: smrtc_user
Password: 2012704
```

### Variables d'environnement
Créez un fichier `.env` dans `SmaRTC-core/deploy/` :
```env
POSTGRES_PASSWORD=2012704
JWT_SECRET=votre_secret_jwt_256bits
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [SmaRTC-core/README.md](SmaRTC-core/README.md) | Documentation technique complète |
| [SmaRTC-core/QUICK_START.md](SmaRTC-core/QUICK_START.md) | Guide de démarrage rapide |
| [SmaRTC-core/SDK_FINAL_REPORT.md](SmaRTC-core/SDK_FINAL_REPORT.md) | Rapport sur les SDKs |
| [SmaRTC-core/docs/](SmaRTC-core/docs/) | Documentation additionnelle |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Apps                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │   C#    │  │   JS    │  │ Flutter │  │ Python  │            │
│  │   SDK   │  │   SDK   │  │   SDK   │  │   SDK   │            │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
└───────┼────────────┼────────────┼────────────┼──────────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Nginx (Port 80)                          │
│                     Load Balancer / Reverse Proxy                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  API Server   │   │ Signal Server │   │    Coturn     │
│  (Port 8080)  │   │  (Port 5001)  │   │  (Port 3478)  │
│   REST API    │   │   SignalR Hub │   │   STUN/TURN   │
└───────┬───────┘   └───────────────┘   └───────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ PostgreSQL  │  │    Redis    │  │   Janus     │              │
│  │ (Port 5432) │  │ (Port 6379) │  │ (Port 8088) │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Changelog

### v2.6 (Janvier 2026) 🐹🦀
- ✅ **Go Example** : Chat console avec goroutines + SignalR client
- ✅ **Rust Example** : Chat console ultra-performant avec tokio + colored
- 🎨 **Luncher_Go** : Launcher WPF multi-clients, go mod tidy/build
- 🎨 **Luncher_Rust** : Launcher WPF multi-clients, cargo build
- 📦 6 langages supportés : C#, Flutter, TypeScript, Python, Go, Rust

### v2.5 (Janvier 2026) 🛡️
- 🔒 **Protection propriétaire** : Licence restrictive, NOTICE, tous droits réservés
- 📝 **README** : Badge Proprietary, avertissements légaux

### v2.4 (Janvier 2026) 🐍
- ✅ **Python Example fonctionnel** : Chat console coloré avec asyncio + SignalR
- 🎨 **Luncher_Python** : Support multi-clients, pip install automatique
- 📦 SDK Python avec aiohttp et signalrcore

### v2.3 (Janvier 2026)
- ✅ **TypeScript Example fonctionnel** : App web Node.js + Express + SignalR
- 🔧 **Fix CORS SignalR** : `SetIsOriginAllowed` + `AllowCredentials` pour apps web
- 🎨 **Luncher_TypeScript** : npm install/build/start automatiques

### v2.2 (Janvier 2026)
- ✅ **Flutter Example fonctionnel** : Chat temps réel multi-clients
- ✅ **C# Example fonctionnel** : Console chat avec SDK SignalR
- 🔧 **Corrections SDK Flutter** :
  - `JoinSession` / `LeaveSession` avec username
  - `SendSignalToSession` avec 3 arguments
  - Événements SignalR corrigés (`SendSignal`, `NewUserArrived`)
- 🎨 **Launchers améliorés** :
  - Flutter Launcher avec Hot Reload/Restart, Copy Logs
  - Service Launcher avec Start/Stop individuel par service
- 🧹 **Structure nettoyée** : Suppression des doublons

### v2.1 (Janvier 2026)
- ✨ **Nouvelle structure workspace** : Organisation en SmaRTC-core, C#, Flutter
- 🎨 **SmaRTC.Service_Launcher** : Application WPF pour gérer Docker
- 📦 **Exemples C#** : Exemple_csharp et Luncher_csharp
- 🧹 **Nettoyage** : Suppression node_modules, mise à jour .gitignore
- 📝 **Documentation** : README restructuré

### v2.0
- 🚀 SDKs multi-langages (C#, JavaScript, Flutter, Python, Rust)
- 🔐 Authentification JWT
- 📊 Monitoring Grafana/Prometheus
- 🐳 Docker Compose optimisé

---

## ⚠️ Avertissement Important

> **Ce projet est publié à titre de démonstration uniquement.**
>
> 🚫 **INTERDICTIONS :**
> - Copier tout ou partie du code source
> - Utiliser le code dans vos projets personnels ou commerciaux
> - Redistribuer le code sous quelque forme que ce soit
> - Créer des œuvres dérivées basées sur ce code
> - Fork ce dépôt à des fins autres que la contribution
>
> ✅ **AUTORISÉ :**
> - Consulter le code à des fins éducatives
> - Référencer ce projet (avec attribution)
> - Contacter l'auteur pour des demandes de licence

---

## 📄 Licence

**© 2026 Mounir Azizi - DeLTa-X Tunisia - Tous droits réservés**

Ce projet est sous licence propriétaire. Voir [LICENSE](LICENSE) et [NOTICE](NOTICE) pour plus de détails.

Toute utilisation non autorisée sera poursuivie conformément aux lois applicables sur la propriété intellectuelle.

---

<div align="center">

**Développé avec ❤️ par [Mounir Azizi](https://github.com/DeLTa-X-Tunisia) 🇹🇳**

*Ce dépôt est un projet portfolio - Merci de respecter le travail de l'auteur*

</div>


