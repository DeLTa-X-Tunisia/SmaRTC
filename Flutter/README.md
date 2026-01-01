# 🎯 SmaRTC Flutter Examples

Ce dossier contient l'exemple Flutter et son launcher C# pour la plateforme SmaRTC.

## 📁 Structure

```
Flutter/
├── Exemple_flutter/      → Application Flutter de chat
│   ├── lib/
│   │   ├── main.dart              → Point d'entrée
│   │   ├── sdk/
│   │   │   └── smartc_client.dart → SDK SmaRTC
│   │   └── screens/
│   │       ├── login_screen.dart  → Écran de connexion
│   │       └── chat_screen.dart   → Écran de chat
│   └── pubspec.yaml               → Dépendances
│
├── Luncher_flutter/      → Launcher C# pour gérer l'app Flutter
│   ├── MainWindow.xaml            → Interface WPF
│   ├── MainViewModel.cs           → Logique
│   └── Luncher_flutter.csproj     → Projet .NET 9
│
└── README.md             → Ce fichier
```

---

## 🚀 Démarrage Rapide

### Prérequis

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (3.10+)
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0) (pour le launcher)
- Services SmaRTC en cours d'exécution (Docker)

### 1️⃣ Installer les dépendances Flutter

```bash
cd Exemple_flutter
flutter pub get
```

### 2️⃣ Lancer l'application

**Option A - Via Flutter CLI :**
```bash
# Sur Chrome (Web)
flutter run -d chrome

# Sur Windows (Desktop)
flutter run -d windows

# Sur un émulateur Android
flutter run -d emulator-5554
```

**Option B - Via le Launcher C# :**
```bash
cd Luncher_flutter
dotnet run
```

Le launcher offre une interface graphique pour :
- Sélectionner le device cible
- Lancer/arrêter l'application
- Hot Reload (🔥) et Hot Restart (♻️)
- Voir les logs en temps réel

---

## 🔐 Identifiants de Test

| Paramètre | Valeur |
|-----------|--------|
| **Mot de passe** | `12345678` |
| **Room** | `Room_flutter` |
| **API URL** | `http://localhost:8080` |
| **Signal Hub** | `http://localhost:5001/signalhub` |

---

## 📱 Fonctionnalités de l'exemple

### Écran de Connexion
- Saisie du nom d'utilisateur
- Mot de passe (par défaut: 12345678)
- Choix de la room
- Options avancées (URLs personnalisées)

### Écran de Chat
- Envoi/réception de messages en temps réel
- Indicateur de connexion (vert/rouge)
- Messages système (join/leave)
- Horodatage des messages
- Interface moderne avec thème sombre

---

## 🛠️ SDK SmaRTC Flutter

Le SDK simplifié (`lib/sdk/smartc_client.dart`) offre :

```dart
// Créer un client
final client = SmaRTCClient(
  config: SmaRTCConfig(
    apiBaseUrl: 'http://localhost:8080',
    signalHubUrl: 'http://localhost:5001/signalhub',
  ),
);

// Inscription (ou connexion si existe)
await client.registerAsync('username', 'password');

// Connexion
await client.loginAsync('username', 'password');

// Connexion au hub SignalR
await client.connectToHubAsync();

// Rejoindre une room
await client.joinRoomAsync('Room_flutter');

// Envoyer un message
await client.sendMessageAsync('Hello from Flutter!');

// Callbacks
client.onMessageReceived = (message) {
  print('${message.sender}: ${message.content}');
};

client.onUserJoined = (username) {
  print('$username a rejoint');
};

// Déconnexion
await client.disconnectAsync();
```

---

## 📦 Dépendances

### Flutter (`pubspec.yaml`)

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0              # Requêtes HTTP
  signalr_netcore: ^1.3.7   # SignalR client
  provider: ^6.1.1          # State management
  google_fonts: ^6.1.0      # Polices
  intl: ^0.19.0             # Formatage dates
  uuid: ^4.3.3              # Génération UUID
```

### Launcher C# (`Luncher_flutter.csproj`)

```xml
<PackageReference Include="CommunityToolkit.Mvvm" Version="8.2.2" />
<PackageReference Include="ModernWpfUI" Version="0.9.6" />
```

---

## 🎨 Screenshots

### Écran de connexion
- Thème sombre avec gradient
- Logo SmaRTC animé
- Formulaire moderne avec Material 3

### Écran de chat
- Messages en bulles colorées
- Barre d'état de connexion
- Saisie avec bouton d'envoi

---

## 🐛 Dépannage

### "Connection refused" 
→ Vérifiez que les services Docker SmaRTC sont lancés :
```bash
cd SmaRTC-core/deploy
docker-compose up -d
```

### "flutter: command not found"
→ Ajoutez Flutter au PATH :
```bash
# Windows PowerShell
$env:PATH += ";C:\flutter\bin"
```

### Hot Reload ne fonctionne pas
→ Assurez-vous d'utiliser `flutter run` (pas `flutter build`)

### Erreur SignalR sur Web
→ Vérifiez la configuration CORS du signal-server

---

## 📄 Licence

MIT License - Voir [LICENSE](../SmaRTC-core/LICENSE)

---

<div align="center">

**Développé avec 💙 par [DeLTa-X Tunisia](https://github.com/DeLTa-X-Tunisia)**

</div>
