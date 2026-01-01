# SmaRTC Flutter Example

Example application demonstrating the usage of SmaRTC Flutter SDK.

## Features

- ✅ User authentication (login/register)
- ✅ Session management (create, list, join)
- ✅ Video/audio calls with WebRTC
- ✅ Real-time participant management
- ✅ Call controls (mute, camera, switch)

## Prerequisites

1. **SmaRTC Backend Running**
   
   Make sure the SmaRTC backend services are running:
   ```bash
   cd ../../deploy
   docker-compose up -d
   ```

2. **Flutter Installed**
   
   ```bash
   flutter doctor
   ```

## Running the Example

### 1. Install Dependencies

```bash
flutter pub get
```

### 2. Configure Backend URLs

Edit `lib/main.dart` and update the URLs if needed:

```dart
await SmaRTCClient.initialize(
  SmaRTCConfig(
    apiUrl: 'http://YOUR_IP:8080',  // Replace with your server IP
    signalServerUrl: 'http://YOUR_IP:5001/signalhub',
    stunServers: ['stun:YOUR_IP:3478'],
  ),
);
```

### 3. Run on Android

```bash
flutter run
```

### 4. Run on iOS

```bash
cd ios
pod install
cd ..
flutter run
```

### 5. Run on Web

```bash
flutter run -d chrome --web-renderer html
```

## Usage

### 1. Create an Account

- Launch the app
- Enter a username and password
- Click "Créer un compte"

### 2. Login

- Enter your credentials
- Click "Connexion"

### 3. Create a Session

- Click the "+" button
- Enter session name and description
- Click "Créer"

### 4. Join a Call

- Click "Rejoindre" on any session
- Allow camera and microphone permissions
- Start calling!

## Troubleshooting

### Connection Issues

If you can't connect to the backend:

1. Check that the backend is running:
   ```bash
   docker ps
   ```

2. Verify the URLs in `main.dart` match your server IP

3. Make sure your device/emulator can reach the backend network

### Permission Issues

On Android, add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
```

On iOS, add to `ios/Runner/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone access is required for audio calls</string>
```

## Testing Multiple Participants

To test with multiple participants:

1. Run the app on multiple devices/emulators
2. Login with different accounts
3. Join the same session from all devices
4. Enjoy the multi-party video call!

## License

MIT License - see [LICENSE](../../../LICENSE)
