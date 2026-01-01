# 🚀 SmaRTC Service Launcher

Application Windows moderne pour gérer les services Docker de la plateforme SmaRTC.

## Fonctionnalités

- ▶️ **Démarrer** tous les services en un clic
- ⏹️ **Arrêter** tous les services en un clic  
- 🔄 **Redémarrer** tous les services
- 📊 **Tableau de bord** avec statut en temps réel de chaque service
- 📋 **Logs** avec gestion des erreurs claire et compréhensible
- 🔗 **Liens rapides** vers Swagger, Grafana, API Health

## Services gérés

| Service | Port | Description |
|---------|------|-------------|
| API | 8080 | REST API Server |
| Signal Server | 5001 | WebRTC Signaling |
| PostgreSQL | 5432 | Base de données |
| Redis | 6379 | Cache en mémoire |
| Nginx | 80 | Reverse Proxy |
| Coturn | 3478 | STUN/TURN Server |
| Janus | 8088 | Media Server |
| Grafana | 3000 | Monitoring Dashboard |
| Prometheus | 9090 | Metrics Collection |

## Prérequis

- **Windows 10/11**
- **.NET 9.0 Runtime**
- **Docker Desktop** (doit être en cours d'exécution)

## Installation

```powershell
# Compiler le projet
cd SmaRTC.Service_Launcher
dotnet build -c Release

# Ou lancer directement
.\Start-Launcher.ps1
```

## Utilisation

1. **Démarrer Docker Desktop** si ce n'est pas déjà fait
2. **Lancer le launcher** via `Launch.bat` ou `Start-Launcher.ps1`
3. **Cliquer sur "Démarrer"** pour lancer tous les services

## Gestion des erreurs

Le launcher détecte et affiche des messages clairs pour :
- Docker non démarré
- Port déjà utilisé
- Erreurs de compilation
- Problèmes de réseau
- Erreurs de permissions

## Auteur

**Azizi Mounir** - DeLTa-X-Tunisia
