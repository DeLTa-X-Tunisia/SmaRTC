# 📱 SmaRTC Flutter SDK

<div align="center">

![Flutter](https://img.shields.io/badge/Flutter-3.10%2B-02569B?logo=flutter)
![Dart](https://img.shields.io/badge/Dart-3.0%2B-0175C2?logo=dart)
![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-00D084)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

**Complete Native Flutter SDK for Video/Audio Calling**

[Quick Start](#-quick-start) • [Features](#-features) • [Documentation](#-documentation) • [Example](#-example-app)

</div>

---

## 🎯 What is SmaRTC Flutter SDK?

A **production-ready Flutter SDK** that brings real-time video and audio calling to your Flutter applications with just a few lines of code. Built on top of the powerful SmaRTC backend platform.

### Why SmaRTC Flutter SDK?

✨ **Easy Integration** - Add video calling in minutes, not days  
🎨 **Beautiful UI** - Pre-built screens and widgets ready to use  
🔐 **Secure** - JWT authentication built-in  
📞 **Multi-party Calls** - Support for multiple participants  
📱 **Cross-platform** - Android, iOS, and Web support  
🎮 **Full Control** - Mute, camera, switch, all included  
📚 **Well Documented** - Comprehensive guides and examples

---

## ✨ Features

### 🔐 Authentication
- JWT-based authentication
- Login & Registration
- Session persistence
- Auto-restore on app restart

### 📞 WebRTC Calling
- Peer-to-peer connections
- Multi-party video calls
- Audio/Video quality control
- STUN/TURN support for NAT traversal

### 🎥 Media Control
- Mute/unmute microphone
- Enable/disable camera
- Switch front/back camera
- Local and remote stream management

### 🎨 Pre-built UI
- **CallScreen** - Full-featured call interface
- **PreviewScreen** - Camera/mic preview
- **ParticipantGrid** - Responsive grid layout
- **CallControls** - Modern control buttons
- **VideoRenderer** - Smooth video playback

### 📡 Real-time Communication
- SignalR for signaling
- WebSocket connections
- Auto-reconnection
- Event-driven architecture

---

## 🚀 Quick Start

### 1. Add Dependency

```yaml
dependencies:
  smartc_sdk:
    path: path/to/smartc_sdk
```

### 2. Initialize SDK

```dart
import 'package:smartc_sdk/smartc_sdk.dart';

await SmaRTCClient.initialize(
  SmaRTCConfig(
    apiUrl: 'http://localhost:8080',
    signalServerUrl: 'http://localhost:5001/signalhub',
  ),
);
```

### 3. Login

```dart
await SmaRTCClient.instance.auth.login(
  username: 'john_doe',
  password: 'password',
);
```

### 4. Start a Call

```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => CallScreen(
      sessionId: sessionId,
      onCallEnded: () => Navigator.pop(context),
    ),
  ),
);
```

**That's it!** 🎉

---

## 📸 Screenshots

### Call Screen
```
┌────────────────────────────────────┐
│  ☰ Team Meeting       👥 3 people  │
├────────────────────────────────────┤
│                                    │
│     ┌─────────┐  ┌─────────┐     │
│     │ User 1  │  │ User 2  │     │
│     │  📹     │  │  📹     │     │
│     └─────────┘  └─────────┘     │
│                                    │
│     ┌─────────┐                   │
│     │  You    │                   │
│     │  📹     │                   │
│     └─────────┘                   │
│                                    │
├────────────────────────────────────┤
│  🎤   📹   🔄   ☎️ Hang Up       │
└────────────────────────────────────┘
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Flutter Application            │
├─────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────┐    │
│  │     SmaRTC Flutter SDK          │    │
│  ├────────────────────────────────┤    │
│  │                                 │    │
│  │  UI Layer (Screens & Widgets)  │    │
│  │  ├─ CallScreen                 │    │
│  │  ├─ PreviewScreen              │    │
│  │  └─ Widgets (Grid, Controls)   │    │
│  │                                 │    │
│  │  Provider (State Management)   │    │
│  │  └─ CallProvider               │    │
│  │                                 │    │
│  │  Services                      │    │
│  │  ├─ AuthService    (REST)      │    │
│  │  ├─ SessionService (REST)      │    │
│  │  ├─ SignalRService (WebSocket) │    │
│  │  └─ WebRTCService  (P2P)       │    │
│  │                                 │    │
│  │  Models & Configuration        │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
              │           │
              ▼           ▼
    ┌──────────────┐  ┌──────────┐
    │   REST API   │  │ SignalR  │
    │   (8080)     │  │  (5001)  │
    └──────────────┘  └──────────┘
              │
              ▼
       ┌──────────────┐
       │   SmaRTC     │
       │   Backend    │
       └──────────────┘
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [README.md](README.md) | Complete SDK documentation |
| [QUICKSTART.md](QUICKSTART.md) | Get started in 5 minutes |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical deep dive |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [VALIDATION.md](VALIDATION.md) | Testing checklist |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

---

## 🎮 Example App

A complete demo app is included showing:

- ✅ User authentication (login/register)
- ✅ Session management (create/list/join)
- ✅ Video calling with multiple participants
- ✅ Camera and microphone controls
- ✅ Beautiful Material Design UI

### Run the Example

```bash
cd example
flutter pub get
flutter run
```

---

## 📦 What's Included?

### Core Services
- `SmaRTCClient` - Main SDK singleton
- `AuthService` - Authentication with JWT
- `SessionService` - Session CRUD operations
- `SignalRService` - Real-time signaling
- `WebRTCService` - Peer connections & media

### UI Components
- `CallScreen` - Full call interface
- `PreviewScreen` - Pre-call preview
- `ParticipantGrid` - Adaptive grid layout
- `CallControls` - Media control buttons
- `VideoRendererWidget` - Video display

### State Management
- `CallProvider` - Reactive state management
- `ParticipantInfo` - Participant tracking
- Event streams for real-time updates

### Models
- `User` - User profile
- `Session` - Call session
- `Participant` - Session participant
- `LoginModel` / `RegisterModel`

---

## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| [Flutter](https://flutter.dev/) | UI Framework |
| [flutter_webrtc](https://pub.dev/packages/flutter_webrtc) | WebRTC implementation |
| [signalr_netcore](https://pub.dev/packages/signalr_netcore) | SignalR client |
| [Provider](https://pub.dev/packages/provider) | State management |
| [http](https://pub.dev/packages/http) | REST API calls |
| [shared_preferences](https://pub.dev/packages/shared_preferences) | Local storage |
| [logger](https://pub.dev/packages/logger) | Logging |

---

## 🔧 Setup & Installation

### Prerequisites
- Flutter 3.10.0+
- Dart 3.0.0+
- SmaRTC backend running

### Quick Setup

Run the setup script:

```bash
./setup.ps1
```

Or manually:

```bash
flutter pub get
cd example
flutter pub get
flutter run
```

---

## 🧪 Testing

### Run Tests
```bash
flutter test
```

### Analyze Code
```bash
flutter analyze
```

### Format Code
```bash
dart format .
```

---

## 🌐 Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Android | ✅ | Fully supported |
| iOS | ✅ | Fully supported |
| Web | ⚠️ | Limited WebRTC support |
| Desktop | ❓ | Not tested |

---

## 📱 Permissions

### Android
Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
```

### iOS
Add to `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone access for audio calls</string>
```

---

## 🐛 Troubleshooting

### Connection Issues
- Verify backend is running
- Check URLs in config
- Ensure device can reach backend

### Permission Issues
- Verify manifest/plist entries
- Request permissions at runtime

### Video Not Working
- Check camera permissions
- Verify WebRTC support
- Test on real device

See [VALIDATION.md](VALIDATION.md) for detailed troubleshooting.

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with:
- ❤️ Flutter
- 💪 WebRTC
- ⚡ SignalR
- 🎨 Material Design

---

## 📞 Support

- 📖 [Documentation](README.md)
- 🐛 [Issues](https://github.com/DeLTa-X-Tunisia/SmaRTC/issues)
- 💬 [Discussions](https://github.com/DeLTa-X-Tunisia/SmaRTC/discussions)

---

<div align="center">

**Made with 💙 by [DeLTa-X-Tunisia](https://github.com/DeLTa-X-Tunisia)**

*Smart Real-Time Communication — Now on Flutter!*

⭐ **Star this repo** if you find it useful!

</div>
