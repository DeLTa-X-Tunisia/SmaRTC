import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartc_sdk/smartc_sdk.dart';
import 'package:permission_handler/permission_handler.dart';
import 'pages/auth_page.dart';

void main() async {
  // Global error handler
  runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();

    debugPrint('🚀 [MAIN] Starting SmaRTC Example App...');

    // Capture Flutter framework errors
    FlutterError.onError = (FlutterErrorDetails details) {
      debugPrint('❌ [FLUTTER ERROR] ${details.exception}');
      debugPrint('Stack trace: ${details.stack}');
      FlutterError.presentError(details);
    };

    // Capture platform errors
    PlatformDispatcher.instance.onError = (error, stack) {
      debugPrint('❌ [PLATFORM ERROR] $error');
      debugPrint('Stack trace: $stack');
      return true;
    };

    try {
      debugPrint('🔧 [MAIN] Initializing SmaRTC SDK...');

      // Initialize SmaRTC SDK
      await SmaRTCClient.initialize(
        SmaRTCConfig(
          apiUrl: 'http://localhost:8080',
          signalServerUrl: 'http://localhost:5001/signalhub',
          stunServers: ['stun:localhost:3478', 'stun:stun.l.google.com:19302'],
          enableLogging: true,
        ),
      );

      // Force logout on app start to require explicit login
      await SmaRTCClient.instance.auth.logout();
      debugPrint('🔒 [MAIN] Cleared any stored authentication');

      debugPrint('✅ [MAIN] SDK initialized successfully');
      debugPrint('🎨 [MAIN] Starting Flutter app...');

      runApp(const MyApp());

      debugPrint('✅ [MAIN] App is now running!');
    } catch (e, stack) {
      debugPrint('❌ [FATAL] Failed to initialize app: $e');
      debugPrint('Stack trace: $stack');

      // Show error screen instead of crashing
      runApp(MaterialApp(
        home: Scaffold(
          backgroundColor: Colors.red.shade900,
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline,
                      size: 64, color: Colors.white),
                  const SizedBox(height: 24),
                  const Text(
                    'Failed to Initialize App',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    e.toString(),
                    style: const TextStyle(color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ));
    }
  }, (error, stack) {
    debugPrint('❌ [ZONE ERROR] $error');
    debugPrint('Stack trace: $stack');
  });
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

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
        title: 'SmaRTC Example',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          brightness: Brightness.light,
          useMaterial3: true,
        ),
        darkTheme: ThemeData(
          primarySwatch: Colors.blue,
          brightness: Brightness.dark,
          useMaterial3: true,
        ),
        home: const HomePage(),
      ),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _sessionNameController = TextEditingController();
  final _sessionDescriptionController = TextEditingController();

  bool _isLoading = false;
  List<Session>? _sessions;

  @override
  void initState() {
    super.initState();
    debugPrint('🏠 [HOME] HomePage initState called');
    // Ne pas restaurer automatiquement la session
    // Les utilisateurs doivent se connecter explicitement
  }

  @override
  void dispose() {
    debugPrint('🏠 [HOME] HomePage disposing...');
    _usernameController.dispose();
    _passwordController.dispose();
    _sessionNameController.dispose();
    _sessionDescriptionController.dispose();
    super.dispose();
  }

  Future<void> _requestPermissions() async {
    await [
      Permission.camera,
      Permission.microphone,
    ].request();
  }

  Future<void> _loadSessions() async {
    debugPrint('📋 [HOME] _loadSessions started');
    setState(() => _isLoading = true);

    try {
      debugPrint('📋 [HOME] Fetching sessions from API...');
      final sessions = await SmaRTCClient.instance.sessions.getSessions();
      debugPrint('📋 [HOME] Got ${sessions.length} sessions');

      if (mounted) {
        setState(() {
          _sessions = sessions;
          _isLoading = false;
        });
        debugPrint('📋 [HOME] Sessions loaded successfully');
      }
    } catch (e, stack) {
      debugPrint('❌ [HOME] Error loading sessions: $e');
      debugPrint('Stack: $stack');

      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur de chargement: $e')),
        );
      }
    }
  }

  Future<void> _createSession() async {
    if (_sessionNameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez entrer un nom de session')),
      );
      return;
    }

    try {
      final session = await SmaRTCClient.instance.sessions.createSession(
        name: _sessionNameController.text,
        description: _sessionDescriptionController.text,
      );

      _sessionNameController.clear();
      _sessionDescriptionController.clear();

      Navigator.of(context).pop();
      await _loadSessions();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Session créée: ${session.name}')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    }
  }

  Future<void> _joinSession(Session session) async {
    await _requestPermissions();

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CallScreen(
          sessionId: session.id,
          sessionName: session.name,
          onCallEnded: () {
            Navigator.of(context).pop();
          },
        ),
      ),
    );
  }

  Future<void> _logout() async {
    await SmaRTCClient.instance.auth.logout();
    setState(() {
      _sessions = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('🎨 [HOME] Building HomePage UI...');
    final auth = SmaRTCClient.instance.auth;

    // Show AuthPage if not authenticated
    if (!auth.isAuthenticated) {
      return AuthPage(
        onAuthenticated: () {
          setState(() {
            _loadSessions();
          });
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('SmaRTC Example'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadSessions,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      body: _buildSessionsList(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateSessionDialog,
        icon: const Icon(Icons.add),
        label: const Text('Créer une session'),
      ),
    );
  }

  Widget _buildSessionsList() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_sessions == null || _sessions!.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.video_library_outlined,
                size: 80, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'Aucune session disponible',
              style: TextStyle(fontSize: 18, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            const Text(
              'Créez une nouvelle session pour commencer',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadSessions,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _sessions!.length,
        itemBuilder: (context, index) {
          final session = _sessions![index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: CircleAvatar(
                child: Text(session.name?.substring(0, 1).toUpperCase() ?? 'S'),
              ),
              title: Text(session.name ?? 'Session #${session.id}'),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (session.description != null) Text(session.description!),
                  const SizedBox(height: 4),
                  Text(
                    'Créé par ${session.creator?.username ?? "Unknown"}',
                    style: const TextStyle(fontSize: 12),
                  ),
                ],
              ),
              trailing: ElevatedButton.icon(
                onPressed: () => _joinSession(session),
                icon: const Icon(Icons.video_call, size: 20),
                label: const Text('Rejoindre'),
              ),
              isThreeLine: session.description != null,
            ),
          );
        },
      ),
    );
  }

  void _showCreateSessionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Créer une session'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _sessionNameController,
              decoration: const InputDecoration(
                labelText: 'Nom de la session',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _sessionDescriptionController,
              decoration: const InputDecoration(
                labelText: 'Description (optionnel)',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: _createSession,
            child: const Text('Créer'),
          ),
        ],
      ),
    );
  }
}
