# 🚀 Guide de Démarrage Rapide - SmaRTC Flutter SDK

Ce guide vous aidera à intégrer rapidement le SDK SmaRTC dans votre application Flutter.

## 📋 Prérequis

- Flutter 3.10.0 ou supérieur
- Dart 3.0.0 ou supérieur
- Backend SmaRTC en cours d'exécution (voir [docker-startup.md](../../docs/docker-startup.md))

## 🎯 Étape 1 : Installation

### Option A : Dépendance locale

Ajoutez dans votre `pubspec.yaml` :

```yaml
dependencies:
  smartc_sdk:
    path: ../path/to/smartc_sdk
```

### Option B : Dépendance Git (future)

```yaml
dependencies:
  smartc_sdk:
    git:
      url: https://github.com/DeLTa-X-Tunisia/SmaRTC.git
      path: sdk/flutter
```

Puis exécutez :

```bash
flutter pub get
```

## 🔧 Étape 2 : Configuration

### Android

Ajoutez les permissions dans `android/app/src/main/AndroidManifest.xml` :

```xml
<manifest ...>
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    
    <application ...>
        ...
    </application>
</manifest>
```

### iOS

Ajoutez dans `ios/Runner/Info.plist` :

```xml
<dict>
    ...
    <key>NSCameraUsageDescription</key>
    <string>Camera access is required for video calls</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>Microphone access is required for audio calls</string>
    ...
</dict>
```

## 💻 Étape 3 : Initialisation

Dans votre `main.dart` :

```dart
import 'package:flutter/material.dart';
import 'package:smartc_sdk/smartc_sdk.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialisez le SDK
  await SmaRTCClient.initialize(
    SmaRTCConfig(
      apiUrl: 'http://YOUR_SERVER_IP:8080',
      signalServerUrl: 'http://YOUR_SERVER_IP:5001/signalhub',
      stunServers: [
        'stun:YOUR_SERVER_IP:3478',
        'stun:stun.l.google.com:19302',
      ],
      enableLogging: true,
    ),
  );
  
  runApp(MyApp());
}
```

## 🔐 Étape 4 : Authentification

```dart
final client = SmaRTCClient.instance;

// Inscription
try {
  await client.auth.register(
    username: 'john_doe',
    password: 'securePassword123',
    role: 'User',
  );
  print('✅ Inscription réussie!');
} catch (e) {
  print('❌ Erreur: $e');
}

// Connexion
try {
  await client.auth.login(
    username: 'john_doe',
    password: 'securePassword123',
  );
  print('✅ Connecté!');
} catch (e) {
  print('❌ Erreur: $e');
}
```

## 📞 Étape 5 : Créer et rejoindre un appel

### Créer une session

```dart
final session = await client.sessions.createSession(
  name: 'Réunion d\'équipe',
  description: 'Sync hebdomadaire',
);

print('Session créée: ${session.id}');
```

### Rejoindre un appel avec l'UI pré-construite

```dart
import 'package:smartc_sdk/smartc_sdk.dart';
import 'package:provider/provider.dart';

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => CallProvider(
            webrtcService: SmaRTCClient.instance.webrtc,
            signalingService: SmaRTCClient.instance.signaling,
          ),
        ),
      ],
      child: MaterialApp(
        home: MyHomePage(),
      ),
    );
  }
}

// Dans votre page
void joinCall(BuildContext context, int sessionId) {
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (context) => CallScreen(
        sessionId: sessionId,
        sessionName: 'Ma session',
        onCallEnded: () {
          Navigator.pop(context);
        },
      ),
    ),
  );
}
```

## 🎨 Étape 6 : Personnalisation (Optionnel)

### Utiliser les composants individuellement

```dart
import 'package:smartc_sdk/smartc_sdk.dart';

// Grid de participants
ParticipantGrid(
  remoteStreams: callProvider.remoteStreams,
  localStream: callProvider.localStream,
  showLocalStream: true,
)

// Contrôles d'appel
CallControls(
  isMicrophoneMuted: callProvider.isMicrophoneMuted,
  isCameraEnabled: callProvider.isCameraEnabled,
  onToggleMicrophone: callProvider.toggleMicrophone,
  onToggleCamera: callProvider.toggleCamera,
  onSwitchCamera: callProvider.switchCamera,
  onEndCall: () => callProvider.leaveCall(),
  activeColor: Colors.blue,
  inactiveColor: Colors.red,
)
```

## 🧪 Étape 7 : Tester

### Tester avec l'exemple

```bash
cd example
flutter pub get
flutter run
```

### Tester sur plusieurs appareils

1. Lancez l'app sur 2 appareils/émulateurs
2. Connectez-vous avec des comptes différents
3. Créez une session depuis le premier appareil
4. Rejoignez la session depuis les deux appareils
5. Profitez de l'appel vidéo! 🎉

## 📚 Ressources supplémentaires

- [README complet](README.md) - Documentation complète
- [Example App](example/) - Application de démonstration
- [API Reference](https://github.com/DeLTa-X-Tunisia/SmaRTC) - Documentation de l'API backend
- [Troubleshooting](../../docs/troubleshooting.md) - Résolution des problèmes

## 🐛 Problèmes courants

### Erreur de connexion au backend

```dart
// Vérifiez que l'URL est correcte et que le backend est accessible
await SmaRTCClient.initialize(
  SmaRTCConfig(
    apiUrl: 'http://192.168.1.100:8080', // Utilisez l'IP de votre machine
    signalServerUrl: 'http://192.168.1.100:5001/signalhub',
  ),
);
```

### Permissions refusées

Assurez-vous d'avoir demandé les permissions avant de rejoindre un appel :

```dart
import 'package:permission_handler/permission_handler.dart';

await [
  Permission.camera,
  Permission.microphone,
].request();
```

### Pas de vidéo sur iOS

Vérifiez que vous avez ajouté les clés `NSCameraUsageDescription` et `NSMicrophoneUsageDescription` dans `Info.plist`.

## 💡 Conseils Pro

1. **Logging** : Activez le logging en développement pour débugger
   ```dart
   SmaRTCConfig(enableLogging: true)
   ```

2. **Gestion d'état** : Utilisez Provider pour une meilleure réactivité
   
3. **Tests** : Testez toujours sur de vrais appareils pour WebRTC

4. **Réseau** : Assurez-vous que STUN/TURN sont configurés pour le NAT traversal

5. **Performance** : Limitez la résolution vidéo pour de meilleures performances sur mobile

## 🎉 C'est parti !

Vous êtes maintenant prêt à construire des applications de visioconférence avec SmaRTC ! 🚀

Pour toute question, consultez la [documentation complète](README.md) ou ouvrez une issue sur GitHub.
