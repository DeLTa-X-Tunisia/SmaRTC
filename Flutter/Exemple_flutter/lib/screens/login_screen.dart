// =============================================================================
// SmaRTC Flutter Example - Login Screen
// =============================================================================

import 'package:flutter/material.dart';
import '../sdk/smartc_client.dart';
import 'chat_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController(text: '12345678');
  final _roomController = TextEditingController(text: 'Room_flutter');
  final _apiUrlController = TextEditingController(text: 'http://localhost:8080');
  final _signalUrlController = TextEditingController(text: 'http://localhost:5001/signalhub');
  
  bool _isLoading = false;
  bool _showAdvanced = false;
  String? _errorMessage;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _roomController.dispose();
    _apiUrlController.dispose();
    _signalUrlController.dispose();
    super.dispose();
  }

  Future<void> _connect() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();
    final room = _roomController.text.trim();

    if (username.isEmpty) {
      setState(() => _errorMessage = 'Veuillez entrer un nom d\'utilisateur');
      return;
    }

    if (password.isEmpty) {
      setState(() => _errorMessage = 'Veuillez entrer un mot de passe');
      return;
    }

    if (room.isEmpty) {
      setState(() => _errorMessage = 'Veuillez entrer un nom de room');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final client = SmaRTCClient(
        config: SmaRTCConfig(
          apiBaseUrl: _apiUrlController.text.trim(),
          signalHubUrl: _signalUrlController.text.trim(),
        ),
      );

      // Inscription (ignore si existe déjà)
      await client.registerAsync(username, password);

      // Connexion
      final loginSuccess = await client.loginAsync(username, password);
      if (!loginSuccess) {
        setState(() {
          _errorMessage = 'Échec de la connexion. Vérifiez vos identifiants.';
          _isLoading = false;
        });
        return;
      }

      // Connexion au hub SignalR
      final hubConnected = await client.connectToHubAsync();
      if (!hubConnected) {
        setState(() {
          _errorMessage = 'Impossible de se connecter au serveur SignalR.';
          _isLoading = false;
        });
        return;
      }

      // Rejoindre la room
      final joined = await client.joinRoomAsync(room);
      if (!joined) {
        setState(() {
          _errorMessage = 'Impossible de rejoindre la room.';
          _isLoading = false;
        });
        return;
      }

      // Navigation vers le chat
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => ChatScreen(client: client, roomName: room),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Erreur: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFF1E1E2E),
              const Color(0xFF2D2D44),
              Colors.indigo.shade900,
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 400),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo et titre
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.indigo.withOpacity(0.3),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.video_call_rounded,
                        size: 64,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'SmaRTC',
                      style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Flutter Chat Demo',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.white70,
                          ),
                    ),
                    const SizedBox(height: 48),

                    // Formulaire
                    Card(
                      color: Colors.white.withOpacity(0.1),
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Username
                            TextField(
                              controller: _usernameController,
                              decoration: const InputDecoration(
                                labelText: 'Nom d\'utilisateur',
                                prefixIcon: Icon(Icons.person_outline),
                              ),
                              textInputAction: TextInputAction.next,
                            ),
                            const SizedBox(height: 16),

                            // Password
                            TextField(
                              controller: _passwordController,
                              decoration: const InputDecoration(
                                labelText: 'Mot de passe',
                                prefixIcon: Icon(Icons.lock_outline),
                              ),
                              obscureText: true,
                              textInputAction: TextInputAction.next,
                            ),
                            const SizedBox(height: 16),

                            // Room
                            TextField(
                              controller: _roomController,
                              decoration: const InputDecoration(
                                labelText: 'Room',
                                prefixIcon: Icon(Icons.meeting_room_outlined),
                              ),
                              textInputAction: TextInputAction.done,
                              onSubmitted: (_) => _connect(),
                            ),
                            const SizedBox(height: 16),

                            // Options avancées
                            TextButton.icon(
                              onPressed: () {
                                setState(() => _showAdvanced = !_showAdvanced);
                              },
                              icon: Icon(
                                _showAdvanced
                                    ? Icons.expand_less
                                    : Icons.expand_more,
                              ),
                              label: const Text('Options avancées'),
                            ),

                            if (_showAdvanced) ...[
                              const SizedBox(height: 16),
                              TextField(
                                controller: _apiUrlController,
                                decoration: const InputDecoration(
                                  labelText: 'API URL',
                                  prefixIcon: Icon(Icons.api),
                                ),
                              ),
                              const SizedBox(height: 16),
                              TextField(
                                controller: _signalUrlController,
                                decoration: const InputDecoration(
                                  labelText: 'Signal Hub URL',
                                  prefixIcon: Icon(Icons.hub),
                                ),
                              ),
                            ],

                            // Message d'erreur
                            if (_errorMessage != null) ...[
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.red.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.error_outline,
                                        color: Colors.red, size: 20),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        _errorMessage!,
                                        style: const TextStyle(color: Colors.red),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],

                            const SizedBox(height: 24),

                            // Bouton de connexion
                            ElevatedButton(
                              onPressed: _isLoading ? null : _connect,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.indigo,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                              child: _isLoading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor: AlwaysStoppedAnimation(
                                            Colors.white),
                                      ),
                                    )
                                  : const Text(
                                      'Se connecter',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Info
                    Text(
                      'Mot de passe par défaut: 12345678',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white54,
                          ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
