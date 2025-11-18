# 🏗️ Architecture du SDK Flutter SmaRTC

Ce document décrit l'architecture interne du SDK Flutter SmaRTC.

## 📦 Structure du Projet

```
smartc_sdk/
├── lib/
│   ├── smartc_sdk.dart              # Point d'entrée principal (exports)
│   ├── core/                        # Cœur du SDK
│   │   ├── client.dart              # Singleton client principal
│   │   └── config.dart              # Configuration SDK
│   ├── services/                    # Couche services
│   │   ├── auth_service.dart        # Authentification JWT
│   │   ├── session_service.dart     # Gestion des sessions
│   │   ├── signalr_service.dart     # Communication temps réel
│   │   └── webrtc_service.dart      # WebRTC peer-to-peer
│   ├── models/                      # Modèles de données
│   │   ├── user.dart                # Utilisateur
│   │   ├── session.dart             # Session
│   │   ├── participant.dart         # Participant
│   │   └── auth_models.dart         # Modèles d'auth
│   ├── providers/                   # State management
│   │   └── call_provider.dart       # Provider pour les appels
│   └── ui/                          # Interface utilisateur
│       ├── screens/                 # Écrans complets
│       │   ├── call_screen.dart     # Écran d'appel
│       │   └── preview_screen.dart  # Prévisualisation
│       └── widgets/                 # Widgets réutilisables
│           ├── participant_grid.dart     # Grille des participants
│           ├── call_controls.dart        # Contrôles d'appel
│           └── video_renderer_widget.dart # Rendu vidéo
├── example/                         # Application de démonstration
│   ├── lib/
│   │   └── main.dart
│   └── pubspec.yaml
├── test/                            # Tests (à venir)
├── pubspec.yaml                     # Dépendances
├── README.md                        # Documentation principale
├── QUICKSTART.md                    # Guide de démarrage rapide
├── CHANGELOG.md                     # Journal des modifications
└── LICENSE                          # Licence MIT
```

## 🔄 Flux de Communication

```
┌─────────────────────────────────────────────────────────────┐
│                        Flutter App                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              CallProvider (State)                     │  │
│  │  - Gère l'état global de l'appel                     │  │
│  │  - Notifie l'UI des changements                      │  │
│  └──────────────────────────────────────────────────────┘  │
│         │                                        │           │
│         ▼                                        ▼           │
│  ┌──────────────┐                     ┌──────────────────┐ │
│  │  WebRTC      │                     │   SignalR        │ │
│  │  Service     │◄───────────────────►│   Service        │ │
│  │              │                     │                  │ │
│  │ - Peer conn. │                     │ - WebSocket      │ │
│  │ - Media      │                     │ - Events         │ │
│  │ - SDP/ICE    │                     │ - Signaling      │ │
│  └──────────────┘                     └──────────────────┘ │
│         │                                        │           │
└─────────┼────────────────────────────────────────┼──────────┘
          │                                        │
          ▼                                        ▼
    ┌──────────┐                          ┌──────────────┐
    │  STUN/   │                          │   SignalR    │
    │  TURN    │                          │   Hub        │
    │  Server  │                          │   (5001)     │
    └──────────┘                          └──────────────┘
          │                                        │
          └────────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   Backend    │
                    │   (API)      │
                    │   (8080)     │
                    └──────────────┘
```

## 🔑 Composants Clés

### 1. SmaRTCClient (Singleton)

Le point d'entrée central du SDK qui :
- Initialise tous les services
- Fournit un accès global via `SmaRTCClient.instance`
- Gère le logging
- Coordonne les services

```dart
// Initialisation
await SmaRTCClient.initialize(config);

// Utilisation
final client = SmaRTCClient.instance;
await client.auth.login(...);
await client.sessions.createSession(...);
await client.webrtc.joinSession(...);
```

### 2. Services Layer

#### AuthService
- Gestion de l'authentification JWT
- Login, Register, Logout
- Persistence des tokens (SharedPreferences)
- Décodage du token pour extraire le user ID

#### SessionService
- CRUD des sessions de communication
- Appels REST au backend
- Gestion des headers d'authentification

#### SignalRService
- Connexion WebSocket via SignalR
- Événements temps réel :
  - `NewUserArrived` : Nouveau participant
  - `SendSignal` : Signaux WebRTC (offer, answer, ice-candidate)
- Auto-reconnexion

#### WebRTCService
- Gestion des connexions peer-to-peer
- Configuration ICE (STUN/TURN)
- Capture des flux média (audio/vidéo)
- Négociation SDP (offer/answer)
- Échange des candidats ICE
- Contrôles média (mute, camera on/off, switch)

### 3. State Management (Provider)

#### CallProvider
- Hérite de `ChangeNotifier`
- Écoute les services WebRTC et SignalR
- Notifie l'UI des changements :
  - Nouveaux streams
  - Participants rejoignant/quittant
  - État des contrôles (micro, caméra)
  - État de connexion

### 4. UI Components

#### Screens (Écrans complets)

**CallScreen**
- Écran d'appel principal
- Affiche la grille des participants
- Contrôles en overlay
- Gestion du cycle de vie de l'appel

**PreviewScreen**
- Prévisualisation avant d'entrer dans l'appel
- Test caméra/microphone
- Configuration des médias

#### Widgets (Composants réutilisables)

**ParticipantGrid**
- Layout responsive pour les participants
- Support 1-N participants
- Grille 2x2 pour 3-4 participants
- Grille 3xN pour 5+ participants

**CallControls**
- Boutons de contrôle en bas de l'écran
- Mute/unmute micro
- Enable/disable caméra
- Switch caméra front/back
- Raccrocher

**VideoRendererWidget**
- Rendu d'un flux vidéo WebRTC
- Support du mirroring (caméra frontale)
- Label du participant
- Gestion du cycle de vie du renderer

## 🔐 Flux d'Authentification

```
1. User entre credentials
   ↓
2. AuthService.login()
   ↓
3. POST /api/auth/login
   ↓
4. Backend vérifie + génère JWT
   ↓
5. SDK reçoit token
   ↓
6. Décodage token → User ID
   ↓
7. Sauvegarde dans SharedPreferences
   ↓
8. Utilisation dans les requêtes suivantes
   (Header: "Authorization: Bearer <token>")
```

## 📞 Flux d'Appel WebRTC

```
1. User rejoint session
   ↓
2. WebRTCService.joinSession()
   ↓
3. Capture média local (getUserMedia)
   ↓
4. Connexion SignalR
   ↓
5. Annonce présence → signaling.announceNewUser()
   ↓
6. Autres peers reçoivent "NewUserArrived"
   ↓
7. Création RTCPeerConnection pour chaque peer
   ↓
8. Ajout des tracks locaux
   ↓
9. Si initiateur : createOffer() → setLocalDescription()
   ↓
10. Envoi SDP offer via SignalR
    ↓
11. Remote peer reçoit offer → setRemoteDescription()
    ↓
12. Remote peer crée answer → setLocalDescription()
    ↓
13. Envoi SDP answer via SignalR
    ↓
14. Initiateur reçoit answer → setRemoteDescription()
    ↓
15. Échange des ICE candidates
    ↓
16. Connexion établie → onTrack() déclenché
    ↓
17. Affichage des streams distants
```

## 🎨 Design Patterns Utilisés

### Singleton Pattern
- `SmaRTCClient` est un singleton pour un accès global

### Observer Pattern
- Les services utilisent des `Stream` pour notifier les changements
- Provider notifie l'UI via `ChangeNotifier`

### Repository Pattern
- Les services agissent comme des repositories pour les données

### Facade Pattern
- `SmaRTCClient` fournit une façade simple pour accéder aux services

### Strategy Pattern
- Différentes stratégies de layout pour `ParticipantGrid` selon le nombre de participants

## 🔄 Gestion du Cycle de Vie

### Initialisation
```dart
1. SmaRTCClient.initialize()
2. Création des services
3. Configuration du logging
4. Prêt à l'emploi
```

### Appel
```dart
1. joinSession() → Capture média + Connexion SignalR
2. Pendant l'appel → Gestion des streams et événements
3. leaveSession() → Fermeture connexions + Nettoyage
```

### Dispose
```dart
1. CallProvider.dispose()
2. WebRTCService.dispose() → Ferme peer connections
3. SignalRService.dispose() → Déconnecte SignalR
4. Nettoyage streams
```

## 📊 Diagramme de Dépendances

```
CallScreen
    ↓ depends on
CallProvider
    ↓ depends on
WebRTCService + SignalRService
    ↓ depends on
SmaRTCConfig
```

```
AuthService → SmaRTCConfig
SessionService → SmaRTCConfig + AuthService
SignalRService → SmaRTCConfig
WebRTCService → SmaRTCConfig + SignalRService
```

## 🧪 Extensibilité

Le SDK est conçu pour être facilement extensible :

### Ajouter un nouveau service
1. Créer `my_service.dart` dans `services/`
2. Injecter dans `SmaRTCClient`
3. Exposer via `client.myService`

### Ajouter un nouveau widget
1. Créer dans `ui/widgets/`
2. Exporter dans `smartc_sdk.dart`
3. Documenter dans README

### Ajouter un nouveau modèle
1. Créer dans `models/`
2. Ajouter `fromJson()` / `toJson()`
3. Utiliser dans les services

## 🔒 Sécurité

- JWT tokens stockés de manière sécurisée avec `shared_preferences`
- Pas de stockage de mots de passe en clair
- Communications HTTPS recommandées en production
- Validation des tokens côté backend

## 📈 Performance

- Streams utilisés pour la réactivité
- Dispose automatique des ressources
- Pas de fuites mémoire (proper disposal)
- Gestion efficace des peer connections

## 🌐 Multi-platforme

Le SDK supporte :
- ✅ Android
- ✅ iOS
- ✅ Web (avec limitations WebRTC)
- ⏳ Desktop (non testé)

## 🚀 Futures Améliorations

- [ ] Chat texte en temps réel
- [ ] Partage d'écran
- [ ] Enregistrement des appels
- [ ] Statistiques de qualité (RTCStatsReport)
- [ ] Gestion des rôles avancés (modérateur, speaker)
- [ ] Réactions emoji
- [ ] Arrière-plans virtuels
- [ ] Tests unitaires et d'intégration
- [ ] CI/CD
- [ ] Publication sur pub.dev

---

**Note** : Cette architecture est évolutive et peut être adaptée selon les besoins du projet.
