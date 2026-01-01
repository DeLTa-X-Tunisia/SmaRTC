# 🔄 Migration & Integration Guide

This guide helps you integrate SmaRTC Flutter SDK into existing Flutter applications or migrate from other video calling solutions.

---

## 📋 Table of Contents

1. [Adding to Existing App](#-adding-to-existing-app)
2. [Migrating from Agora](#-migrating-from-agora)
3. [Migrating from Twilio](#-migrating-from-twilio)
4. [Migrating from Jitsi](#-migrating-from-jitsi)
5. [Custom Backend Integration](#-custom-backend-integration)
6. [Advanced Configuration](#-advanced-configuration)

---

## 🚀 Adding to Existing App

### Step 1: Add Dependency

In your `pubspec.yaml`:

```yaml
dependencies:
  smartc_sdk:
    path: ../path/to/smartc_sdk
  provider: ^6.1.1  # For state management
```

### Step 2: Initialize in main()

```dart
import 'package:smartc_sdk/smartc_sdk.dart';
import 'package:provider/provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize SmaRTC SDK
  await SmaRTCClient.initialize(
    SmaRTCConfig(
      apiUrl: 'http://your-server:8080',
      signalServerUrl: 'http://your-server:5001/signalhub',
      stunServers: ['stun:your-server:3478'],
    ),
  );
  
  runApp(MyApp());
}
```

### Step 3: Wrap App with Provider

```dart
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Your existing providers...
        
        // Add SmaRTC provider
        ChangeNotifierProvider(
          create: (_) => CallProvider(
            webrtcService: SmaRTCClient.instance.webrtc,
            signalingService: SmaRTCClient.instance.signaling,
          ),
        ),
      ],
      child: MaterialApp(
        home: YourHomeScreen(),
      ),
    );
  }
}
```

### Step 4: Integrate Auth

```dart
// In your login flow
class LoginScreen extends StatelessWidget {
  Future<void> _handleLogin() async {
    try {
      // Your existing auth...
      
      // Also login to SmaRTC
      await SmaRTCClient.instance.auth.login(
        username: username,
        password: password,
      );
      
      // Navigate to home
    } catch (e) {
      // Handle error
    }
  }
}
```

### Step 5: Add Video Call Feature

```dart
// Anywhere in your app
void startVideoCall(BuildContext context, int sessionId) {
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (context) => CallScreen(
        sessionId: sessionId,
        onCallEnded: () => Navigator.pop(context),
      ),
    ),
  );
}
```

---

## 🔄 Migrating from Agora

### Before (Agora)

```dart
// Agora initialization
await AgoraRtcEngine.create(appId);
await engine.enableVideo();
await engine.joinChannel(token, channel, null, uid);
```

### After (SmaRTC)

```dart
// SmaRTC initialization (once in main)
await SmaRTCClient.initialize(config);

// Join call
await SmaRTCClient.instance.webrtc.joinSession(sessionId);
```

### Key Differences

| Feature | Agora | SmaRTC |
|---------|-------|--------|
| Setup | Complex, needs app ID | Simple config |
| Auth | Separate token system | Integrated JWT |
| UI | Build yourself | Pre-built components |
| Backend | Managed service | Self-hosted |
| Pricing | Per minute | Free (self-hosted) |

### Migration Steps

1. **Replace Agora package**:
   ```yaml
   # Remove
   # agora_rtc_engine: ^x.x.x
   
   # Add
   smartc_sdk:
     path: path/to/smartc_sdk
   ```

2. **Replace initialization**:
   ```dart
   // Before
   await AgoraRtcEngine.create(appId);
   
   // After
   await SmaRTCClient.initialize(config);
   ```

3. **Replace channel join**:
   ```dart
   // Before
   await engine.joinChannel(token, channel, null, uid);
   
   // After
   await SmaRTCClient.instance.webrtc.joinSession(sessionId);
   ```

4. **Replace UI**:
   ```dart
   // Before
   AgoraVideoView(...)
   
   // After
   CallScreen(sessionId: sessionId)
   ```

---

## 🔄 Migrating from Twilio

### Before (Twilio)

```dart
TwilioVideo.connectToRoom(
  accessToken: token,
  roomName: roomName,
  identity: identity,
);
```

### After (SmaRTC)

```dart
await SmaRTCClient.instance.auth.login(...);
await SmaRTCClient.instance.webrtc.joinSession(sessionId);
```

### Migration Mapping

| Twilio | SmaRTC Equivalent |
|--------|-------------------|
| `accessToken` | JWT from login |
| `roomName` | Session ID |
| `identity` | Username |
| `connectToRoom()` | `joinSession()` |
| `TwilioVideoView` | `CallScreen` |

---

## 🔄 Migrating from Jitsi

### Before (Jitsi)

```dart
JitsiMeet.joinMeeting(
  JitsiMeetingOptions(room: "room-name")
    ..userDisplayName = "User Name"
);
```

### After (SmaRTC)

```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => CallScreen(
      sessionId: sessionId,
      sessionName: "Meeting Name",
    ),
  ),
);
```

### Advantages

| Aspect | Jitsi | SmaRTC |
|--------|-------|--------|
| Integration | External app | Native Flutter |
| Customization | Limited | Full control |
| Branding | Jitsi branding | Your branding |
| Backend | Jitsi servers | Your servers |

---

## 🔧 Custom Backend Integration

If you have an existing backend and want to integrate SmaRTC:

### Option 1: Use SmaRTC Backend

Deploy the SmaRTC backend alongside your existing backend:

```yaml
# docker-compose.yml
services:
  your-backend:
    # Your existing backend
  
  smartc-api:
    image: smartc/api:latest
    ports:
      - "8080:80"
  
  smartc-signaling:
    image: smartc/signal-server:latest
    ports:
      - "5001:5001"
```

### Option 2: Implement Compatible API

If you want to integrate with your backend, implement these endpoints:

#### Auth Endpoints

```
POST /api/auth/register
POST /api/auth/login
```

#### Session Endpoints

```
GET  /api/session
GET  /api/session/{id}
POST /api/session
PUT  /api/session/{id}
DELETE /api/session/{id}
```

#### SignalR Hub

Implement a SignalR hub with these methods:

```csharp
public class SignalHub : Hub
{
    public async Task NewUser(string user) { ... }
    public async Task SendSignal(string signal, string user) { ... }
}
```

### Option 3: Extend SDK Services

Create custom services that extend SDK services:

```dart
class MyCustomAuthService extends AuthService {
  MyCustomAuthService(SmaRTCConfig config) : super(config);
  
  @override
  Future<void> login({
    required String username,
    required String password,
  }) async {
    // Your custom auth logic
    // ...
    
    // Call parent if needed
    await super.login(username: username, password: password);
  }
}
```

---

## 🎨 Advanced Configuration

### Custom STUN/TURN Servers

```dart
await SmaRTCClient.initialize(
  SmaRTCConfig(
    apiUrl: 'http://your-server:8080',
    signalServerUrl: 'http://your-server:5001/signalhub',
    stunServers: [
      'stun:stun.l.google.com:19302',
      'stun:your-server:3478',
    ],
    turnServers: [
      TurnServer(
        url: 'turn:your-server:3478',
        username: 'username',
        credential: 'password',
      ),
    ],
  ),
);
```

### Custom Logging

```dart
await SmaRTCClient.initialize(
  SmaRTCConfig(
    apiUrl: 'http://your-server:8080',
    signalServerUrl: 'http://your-server:5001/signalhub',
    enableLogging: true,  // Enable in debug
    connectionTimeout: Duration(seconds: 30),
  ),
);
```

### Custom UI Theme

```dart
CallControls(
  isMicrophoneMuted: false,
  isCameraEnabled: true,
  onToggleMicrophone: () {},
  onToggleCamera: () {},
  onSwitchCamera: () {},
  onEndCall: () {},
  // Customize colors
  backgroundColor: Colors.black,
  activeColor: Colors.blue,
  inactiveColor: Colors.red,
)
```

### Using Individual Widgets

Instead of using `CallScreen`, compose your own UI:

```dart
class MyCustomCallScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Video grid
          Consumer<CallProvider>(
            builder: (context, provider, _) {
              return ParticipantGrid(
                remoteStreams: provider.remoteStreams,
                localStream: provider.localStream,
              );
            },
          ),
          
          // Your custom overlay
          Positioned(
            top: 0,
            child: MyCustomHeader(),
          ),
          
          // Controls
          Positioned(
            bottom: 0,
            child: Consumer<CallProvider>(
              builder: (context, provider, _) {
                return CallControls(
                  isMicrophoneMuted: provider.isMicrophoneMuted,
                  isCameraEnabled: provider.isCameraEnabled,
                  onToggleMicrophone: provider.toggleMicrophone,
                  onToggleCamera: provider.toggleCamera,
                  onSwitchCamera: provider.switchCamera,
                  onEndCall: () => provider.leaveCall(),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 🔐 SSO Integration

If your app uses SSO (Single Sign-On):

```dart
class MySSOAuthService {
  Future<void> loginWithSSO(String ssoToken) async {
    // 1. Validate SSO token with your backend
    final myUserData = await validateSSOToken(ssoToken);
    
    // 2. Create/get SmaRTC user
    final smartcUser = await getOrCreateSmaRTCUser(myUserData);
    
    // 3. Login to SmaRTC with the user
    await SmaRTCClient.instance.auth.login(
      username: smartcUser.username,
      password: smartcUser.temporaryPassword,
    );
  }
}
```

---

## 📊 Analytics Integration

Track video call events:

```dart
class AnalyticsCallProvider extends CallProvider {
  final AnalyticsService analytics;
  
  AnalyticsCallProvider({
    required WebRTCService webrtcService,
    required SignalRService signalingService,
    required this.analytics,
  }) : super(
    webrtcService: webrtcService,
    signalingService: signalingService,
  );
  
  @override
  Future<void> joinCall(int sessionId) async {
    analytics.logEvent('call_started', {'session_id': sessionId});
    await super.joinCall(sessionId);
  }
  
  @override
  Future<void> leaveCall() async {
    analytics.logEvent('call_ended');
    await super.leaveCall();
  }
}
```

---

## 🧪 Testing Integration

### Mock Services for Testing

```dart
class MockAuthService implements AuthService {
  @override
  Future<void> login({
    required String username,
    required String password,
  }) async {
    // Mock login for tests
    await Future.delayed(Duration(milliseconds: 100));
  }
  
  // ... other methods
}

// In tests
testWidgets('Login flow test', (tester) async {
  final mockAuth = MockAuthService();
  // ... test your flow
});
```

---

## 🚀 Production Checklist

Before going to production:

- [ ] Update all URLs to production servers
- [ ] Use HTTPS for all connections
- [ ] Configure production STUN/TURN servers
- [ ] Disable debug logging
- [ ] Test on real devices
- [ ] Test with poor network conditions
- [ ] Verify permissions on all platforms
- [ ] Add error tracking (Sentry, Firebase Crashlytics)
- [ ] Test with multiple simultaneous calls
- [ ] Load test the backend

---

## 📞 Support

Need help with migration?

- 📖 [Documentation](README.md)
- 🐛 [Report Issues](https://github.com/DeLTa-X-Tunisia/SmaRTC/issues)
- 💬 [Discussions](https://github.com/DeLTa-X-Tunisia/SmaRTC/discussions)

---

**Happy Migrating! 🚀**
