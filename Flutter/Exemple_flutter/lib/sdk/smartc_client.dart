// =============================================================================
// SmaRTC Flutter SDK - Client simplifié
// =============================================================================

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:signalr_netcore/signalr_client.dart';

/// Configuration du client SmaRTC
class SmaRTCConfig {
  final String apiBaseUrl;
  final String signalHubUrl;

  const SmaRTCConfig({
    this.apiBaseUrl = 'http://localhost:8080',
    this.signalHubUrl = 'http://localhost:5001/signalhub',
  });
}

/// Modèle utilisateur
class SmaRTCUser {
  final String id;
  final String username;
  final String? token;

  SmaRTCUser({required this.id, required this.username, this.token});

  factory SmaRTCUser.fromJson(Map<String, dynamic> json) {
    return SmaRTCUser(
      id: json['id']?.toString() ?? '',
      username: json['username'] ?? '',
      token: json['token'],
    );
  }
}

/// Message de chat
class ChatMessage {
  final String sender;
  final String content;
  final DateTime timestamp;
  final bool isSystem;

  ChatMessage({
    required this.sender,
    required this.content,
    required this.timestamp,
    this.isSystem = false,
  });
}

/// Client SmaRTC principal
class SmaRTCClient {
  final SmaRTCConfig config;
  HubConnection? _hubConnection;
  SmaRTCUser? _currentUser;
  String? _currentRoom;
  bool _isConnected = false;

  // Callbacks
  Function(ChatMessage)? onMessageReceived;
  Function(String)? onUserJoined;
  Function(String)? onUserLeft;
  Function(String)? onError;
  Function()? onConnected;
  Function()? onDisconnected;

  SmaRTCClient({SmaRTCConfig? config}) : config = config ?? const SmaRTCConfig();

  /// Utilisateur actuel
  SmaRTCUser? get currentUser => _currentUser;

  /// Room actuelle
  String? get currentRoom => _currentRoom;

  /// État de connexion
  bool get isConnected => _isConnected;

  /// Inscription d'un nouvel utilisateur
  Future<bool> registerAsync(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('${config.apiBaseUrl}/api/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'password': password,
          'email': '$username@smaRTC.local',
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return true;
      } else if (response.statusCode == 400 || response.statusCode == 409) {
        // Utilisateur existe déjà - OK pour login
        final body = response.body.toLowerCase();
        if (body.contains('already') || body.contains('exists')) {
          return true;
        }
      }
      return false;
    } catch (e) {
      onError?.call('Erreur d\'inscription: $e');
      return false;
    }
  }

  /// Connexion utilisateur
  Future<bool> loginAsync(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('${config.apiBaseUrl}/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _currentUser = SmaRTCUser(
          id: data['userId']?.toString() ?? data['id']?.toString() ?? '',
          username: username,
          token: data['token'],
        );
        return true;
      }
      return false;
    } catch (e) {
      onError?.call('Erreur de connexion: $e');
      return false;
    }
  }

  /// Connexion au hub SignalR
  Future<bool> connectToHubAsync() async {
    try {
      _hubConnection = HubConnectionBuilder()
          .withUrl(config.signalHubUrl)
          .withAutomaticReconnect()
          .build();

      // Handlers pour les événements
      _hubConnection!.on('ReceiveSignal', _handleReceiveSignal);
      _hubConnection!.on('UserJoined', _handleUserJoined);
      _hubConnection!.on('UserLeft', _handleUserLeft);
      _hubConnection!.on('ReceiveMessage', _handleReceiveMessage);

      _hubConnection!.onclose(({error}) {
        _isConnected = false;
        onDisconnected?.call();
      });

      _hubConnection!.onreconnecting(({error}) {
        _isConnected = false;
      });

      _hubConnection!.onreconnected(({connectionId}) {
        _isConnected = true;
        // Rejoindre la room si on était dans une
        if (_currentRoom != null) {
          joinRoomAsync(_currentRoom!);
        }
      });

      await _hubConnection!.start();
      _isConnected = true;
      onConnected?.call();
      return true;
    } catch (e) {
      onError?.call('Erreur de connexion au hub: $e');
      return false;
    }
  }

  /// Rejoindre une room
  Future<bool> joinRoomAsync(String roomName) async {
    if (_hubConnection == null || !_isConnected) {
      onError?.call('Non connecté au hub');
      return false;
    }

    try {
      await _hubConnection!.invoke('JoinSession', args: [roomName]);
      _currentRoom = roomName;
      
      // Message système
      onMessageReceived?.call(ChatMessage(
        sender: 'Système',
        content: '${_currentUser?.username ?? "Vous"} a rejoint la room $roomName',
        timestamp: DateTime.now(),
        isSystem: true,
      ));
      
      return true;
    } catch (e) {
      onError?.call('Erreur pour rejoindre la room: $e');
      return false;
    }
  }

  /// Quitter la room
  Future<void> leaveRoomAsync() async {
    if (_hubConnection == null || _currentRoom == null) return;

    try {
      await _hubConnection!.invoke('LeaveSession', args: [_currentRoom]);
      _currentRoom = null;
    } catch (e) {
      onError?.call('Erreur pour quitter la room: $e');
    }
  }

  /// Envoyer un message
  Future<bool> sendMessageAsync(String message) async {
    if (_hubConnection == null || _currentRoom == null || !_isConnected) {
      onError?.call('Non connecté ou pas dans une room');
      return false;
    }

    try {
      final signalData = jsonEncode({
        'type': 'chat',
        'sender': _currentUser?.username ?? 'Anonymous',
        'content': message,
        'timestamp': DateTime.now().toIso8601String(),
      });

      await _hubConnection!.invoke('SendSignalToSession', args: [_currentRoom, signalData]);
      
      // Ajouter le message localement
      onMessageReceived?.call(ChatMessage(
        sender: _currentUser?.username ?? 'Moi',
        content: message,
        timestamp: DateTime.now(),
      ));
      
      return true;
    } catch (e) {
      onError?.call('Erreur d\'envoi du message: $e');
      return false;
    }
  }

  /// Déconnexion
  Future<void> disconnectAsync() async {
    if (_currentRoom != null) {
      await leaveRoomAsync();
    }
    
    if (_hubConnection != null) {
      await _hubConnection!.stop();
      _hubConnection = null;
    }
    
    _isConnected = false;
    _currentUser = null;
    onDisconnected?.call();
  }

  // ============= Handlers privés =============

  void _handleReceiveSignal(List<Object?>? args) {
    if (args == null || args.isEmpty) return;

    try {
      final signalData = args[0]?.toString() ?? '';
      final data = jsonDecode(signalData);
      
      if (data['type'] == 'chat') {
        final sender = data['sender'] ?? 'Unknown';
        // Ne pas afficher nos propres messages (déjà affichés)
        if (sender != _currentUser?.username) {
          onMessageReceived?.call(ChatMessage(
            sender: sender,
            content: data['content'] ?? '',
            timestamp: DateTime.tryParse(data['timestamp'] ?? '') ?? DateTime.now(),
          ));
        }
      }
    } catch (e) {
      // Ignorer les erreurs de parsing
    }
  }

  void _handleUserJoined(List<Object?>? args) {
    if (args != null && args.isNotEmpty) {
      final username = args[0]?.toString() ?? 'Unknown';
      onUserJoined?.call(username);
      onMessageReceived?.call(ChatMessage(
        sender: 'Système',
        content: '$username a rejoint la room',
        timestamp: DateTime.now(),
        isSystem: true,
      ));
    }
  }

  void _handleUserLeft(List<Object?>? args) {
    if (args != null && args.isNotEmpty) {
      final username = args[0]?.toString() ?? 'Unknown';
      onUserLeft?.call(username);
      onMessageReceived?.call(ChatMessage(
        sender: 'Système',
        content: '$username a quitté la room',
        timestamp: DateTime.now(),
        isSystem: true,
      ));
    }
  }

  void _handleReceiveMessage(List<Object?>? args) {
    if (args == null || args.length < 2) return;
    
    final sender = args[0]?.toString() ?? 'Unknown';
    final content = args[1]?.toString() ?? '';
    
    if (sender != _currentUser?.username) {
      onMessageReceived?.call(ChatMessage(
        sender: sender,
        content: content,
        timestamp: DateTime.now(),
      ));
    }
  }
}
