# 📡 SmaRTC Flutter SDK

A complete Flutter SDK for **SmaRTC** (Smart Real-Time Communication) that enables easy integration of video/audio calling features into any Flutter application.

## ✨ Features

- 🔐 **JWT Authentication** - Secure login and registration
- 📞 **WebRTC Support** - High-quality audio/video calls
- 🎥 **Session Management** - Create and join communication sessions
- 💬 **SignalR Integration** - Real-time signaling for peer connections
- 🎨 **Pre-built UI Components** - Ready-to-use call screens
- 📱 **Multi-platform** - Android, iOS, and Web support
- 🧩 **Provider State Management** - Clean and reactive architecture

## 📦 Installation

Add this to your package's `pubspec.yaml` file:

```yaml
dependencies:
  smartc_sdk:
    path: ../path/to/smartc_sdk
```

Then run:

```bash
flutter pub get
```

## 🚀 Quick Start

### 1. Initialize the SDK

```dart
import 'package:smartc_sdk/smartc_sdk.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize SDK
  await SmaRTCClient.initialize(
    apiUrl: 'http://localhost:8080',
    signalServerUrl: 'http://localhost:5001/signalhub',
    stunServers: ['stun:localhost:3478'],
    turnServers: [], // Optional TURN servers
  );
  
  runApp(MyApp());
}
```

### 2. Authentication

```dart
final client = SmaRTCClient.instance;

// Register
try {
  await client.auth.register(
    username: 'john_doe',
    password: 'securePassword123',
    role: 'User',
  );
} catch (e) {
  print('Registration failed: $e');
}

// Login
try {
  await client.auth.login(
    username: 'john_doe',
    password: 'securePassword123',
  );
  print('Logged in successfully!');
} catch (e) {
  print('Login failed: $e');
}
```

### 3. Create and Join a Session

```dart
// Create a session
final session = await client.sessions.createSession(
  name: 'Team Meeting',
  description: 'Weekly sync',
);

// Join the session
await client.webrtc.joinSession(session.id);
```

### 4. Use the Pre-built Call UI

```dart
import 'package:smartc_sdk/smartc_sdk.dart';

class VideoCallPage extends StatelessWidget {
  final int sessionId;

  const VideoCallPage({required this.sessionId});

  @override
  Widget build(BuildContext context) {
    return CallScreen(
      sessionId: sessionId,
      onCallEnded: () {
        Navigator.pop(context);
      },
    );
  }
}
```

## 📱 Example App

Check out the [example](example/) directory for a complete demo application.

To run the example:

```bash
cd example
flutter run
```

## 🏗️ Architecture

```
smartc_sdk/
├── lib/
│   ├── smartc_sdk.dart          # Main entry point
│   ├── core/
│   │   ├── client.dart          # SDK client singleton
│   │   └── config.dart          # Configuration
│   ├── services/
│   │   ├── auth_service.dart    # Authentication
│   │   ├── session_service.dart # Session management
│   │   ├── signalr_service.dart # SignalR communication
│   │   └── webrtc_service.dart  # WebRTC calls
│   ├── models/
│   │   ├── user.dart
│   │   ├── session.dart
│   │   └── participant.dart
│   ├── ui/
│   │   ├── screens/
│   │   │   ├── call_screen.dart
│   │   │   └── preview_screen.dart
│   │   └── widgets/
│   │       ├── participant_grid.dart
│   │       ├── call_controls.dart
│   │       └── video_renderer_widget.dart
│   └── providers/
│       └── call_provider.dart
└── example/                     # Demo app
```

## 🎯 API Reference

### SmaRTCClient

Main SDK client (singleton).

```dart
final client = SmaRTCClient.instance;
```

### AuthService

Handle authentication.

- `register(username, password, role)` - Register a new user
- `login(username, password)` - Login and get JWT token
- `logout()` - Clear session
- `isAuthenticated` - Check auth status

### SessionService

Manage communication sessions.

- `getSessions()` - List all sessions
- `getSession(id)` - Get session details
- `createSession(name, description)` - Create a new session
- `deleteSession(id)` - Delete a session

### WebRTCService

Handle WebRTC calls.

- `joinSession(sessionId)` - Join a call
- `leaveSession()` - Leave the current call
- `toggleMicrophone()` - Mute/unmute audio
- `toggleCamera()` - Enable/disable video
- `switchCamera()` - Switch front/back camera
- `getLocalStream()` - Get local media stream
- `getRemoteStreams()` - Get all remote streams

## 🔧 Configuration

### Permissions (Android)

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

### Permissions (iOS)

Add to `ios/Runner/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone access is required for audio calls</string>
```

## 🧪 Testing

Run tests:

```bash
flutter test
```

## 📄 License

MIT License - see [LICENSE](../../LICENSE)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please use the [GitHub Issues](https://github.com/DeLTa-X-Tunisia/SmaRTC/issues) page.
