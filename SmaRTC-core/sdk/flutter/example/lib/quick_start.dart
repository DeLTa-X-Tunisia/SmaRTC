import 'package:flutter/material.dart';
import 'package:smartc_sdk/smartc_sdk.dart';

/// 🚀 Quick Start - Exemple minimal SmaRTC
/// 
/// Ce fichier montre comment créer une application de visioconférence
/// en moins de 50 lignes de code !

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1️⃣ Initialiser le SDK
  await SmaRTCClient.initialize(
    SmaRTCConfig(
      apiUrl: 'http://localhost:8080',
      signalServerUrl: 'http://localhost:5001/signalhub',
      stunServers: ['stun:stun.l.google.com:19302'],
    ),
  );

  runApp(const QuickStartApp());
}

class QuickStartApp extends StatelessWidget {
  const QuickStartApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SmaRTC Quick Start',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const LoginScreen(),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController(text: 'demo');
  final _passwordController = TextEditingController(text: 'Demo123!');

  Future<void> _login() async {
    try {
      // 2️⃣ Se connecter
      await SmaRTCClient.instance.auth.login(
        username: _usernameController.text,
        password: _passwordController.text,
      );

      // 3️⃣ Créer une session
      final session = await SmaRTCClient.instance.sessions.createSession(
        name: 'Quick Start Session',
        description: 'Ma première session SmaRTC',
      );

      if (!mounted) return;

      // 4️⃣ Rejoindre la session
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => CallScreen(
            sessionId: session.id,
            sessionName: session.name,
            onCallEnded: () => Navigator.pop(context),
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('SmaRTC Quick Start')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.video_call, size: 80, color: Colors.blue),
            const SizedBox(height: 32),
            TextField(
              controller: _usernameController,
              decoration: const InputDecoration(
                labelText: 'Username',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(
                labelText: 'Password',
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _login,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
              ),
              child: const Text('Démarrer une session'),
            ),
          ],
        ),
      ),
    );
  }
}
