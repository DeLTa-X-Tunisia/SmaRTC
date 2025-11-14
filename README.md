<div align="center">

# 📡 SmaRTC
<p align="center">
  <img src="https://img.shields.io/badge/Author-Azizi%20Mounir-blue?style=for-the-badge" alt="Author: Azizi Mounir">
  <img src="https://img.shields.io/badge/Phone-%2B216%2027%20774%20075%20🇹🇳-006400?style=for-the-badge" alt="Phone: +21627774075">
</p>

### *Smart Real-Time Communication — Built for Today, Styled Like Yesterday*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-00D084?logo=webrtc)](https://webrtc.org/)
[![SignalR](https://img.shields.io/badge/SignalR-Real--Time-8A2BE2?logo=microsoft)](https://dotnet.microsoft.com/apps/aspnet/signalr)

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
- 📚 **Client SDKs** — JavaScript, C#, and Swift SDKs to get you coding, not configuring.
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

## 📖 Documentation

Dive deeper into the platform with our comprehensive docs:

- **[Getting Started](docs/docker-startup.md)** — Step-by-step setup guide
- **[Development Guide](docs/development-guide.md)** — Best practices, migrations, and conventions
- **[Authentication & Claims](docs/auth-claims.md)** — The JWT claim resolution story
- **[Troubleshooting](docs/troubleshooting.md)** — Common issues and solutions
- **[Test Report](docs/test-report.md)** — Full test suite validation

---

## 🛠️ Built With

- **[.NET 9](https://dotnet.microsoft.com/)** — The backend framework that keeps on giving
- **[ASP.NET Core](https://docs.microsoft.com/aspnet/core)** — RESTful APIs made easy
- **[Entity Framework Core](https://docs.microsoft.com/ef/core/)** — ORM with migrations
- **[SignalR](https://dotnet.microsoft.com/apps/aspnet/signalr)** — Real-time WebSocket magic
- **[PostgreSQL](https://www.postgresql.org/)** — Battle-tested relational database
- **[Redis](https://redis.io/)** — Blazing-fast in-memory cache
- **[Docker](https://www.docker.com/)** — Containerization for the win
- **[Coturn](https://github.com/coturn/coturn)** — STUN/TURN server for NAT traversal

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


