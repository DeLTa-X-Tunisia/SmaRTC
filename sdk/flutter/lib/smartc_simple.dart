import 'package:smartc_sdk/smartc_sdk.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:smartc_sdk/models/session.dart';
import 'package:smartc_sdk/services/webrtc_service.dart';

/// Wrapper simplifié du SDK SmaRTC pour une utilisation ultra-simple
/// 
/// Exemple d'utilisation :
/// ```dart
/// final smartc = SmaRTCSimple();
/// await smartc.login('demo', 'Demo123!');
/// await smartc.startCall('Mon appel');
/// ```
class SmaRTCSimple {
  static final SmaRTCSimple _instance = SmaRTCSimple._internal();
  factory SmaRTCSimple() => _instance;
  SmaRTCSimple._internal();
  
  final _client = SmaRTCClient.instance;
  int? _currentSessionId;
  
  // ==========================================
  // 🔐 Authentification simplifiée
  // ==========================================
  
  /// Se connecter avec username et password
  /// Retourne true si succès, lance une exception sinon
  Future<bool> login(String username, String password) async {
    try {
      await _client.auth.login(username: username, password: password);
      return true;
    } catch (e) {
      if (e.toString().contains('401') || e.toString().contains('Unauthorized')) {
        throw SmaRTCSimpleError('Identifiants incorrects', original: e);
      } else if (e.toString().contains('network') || e.toString().contains('connection')) {
        throw SmaRTCSimpleError('Problème de connexion', original: e);
      }
      throw SmaRTCSimpleError('Erreur de connexion: $e', original: e);
    }
  }
  
  /// Créer un compte
  Future<bool> register(String username, String password, {String role = 'User'}) async {
    try {
      await _client.auth.register(username: username, password: password, role: role);
      return true;
    } catch (e) {
      if (e.toString().contains('exists') || e.toString().contains('409')) {
        throw SmaRTCSimpleError('Ce nom d\'utilisateur existe déjà', original: e);
      }
      throw SmaRTCSimpleError('Erreur d\'inscription: $e', original: e);
    }
  }
  
  /// Se déconnecter
  Future<void> logout() async {
    if (_currentSessionId != null) {
      await endCall();
    }
    await _client.auth.logout();
  }
  
  /// Vérifie si l'utilisateur est connecté
  bool get isLoggedIn => _client.auth.isAuthenticated;
  
  /// Récupère le nom d'utilisateur actuel
  String? get currentUsername => _client.auth.username;
  
  // ==========================================
  // 📹 Appels vidéo simplifiés
  // ==========================================
  
  /// Démarre un appel vidéo (crée une session et rejoint automatiquement)
  /// 
  /// [name] Nom de l'appel (ex: "Réunion d'équipe")
  /// [description] Description optionnelle
  /// 
  /// Retourne l'ID de la session créée
  Future<int> startCall(String name, {String? description}) async {
    try {
      // Créer la session
      final session = await _client.sessions.createSession(name: name, description: description);
      _currentSessionId = session.id;
      
      // Rejoindre automatiquement
      await _client.webrtc.joinSession(session.id);
      
      return session.id;
    } catch (e) {
      if (e.toString().contains('session')) {
        throw SmaRTCSimpleError('Impossible de créer l\'appel', original: e);
      }
      throw SmaRTCSimpleError('Erreur lors du démarrage: $e', original: e);
    }
  }
  
  /// Rejoindre un appel existant avec son ID
  Future<void> joinCall(int sessionId) async {
    try {
      await _client.webrtc.joinSession(sessionId);
      _currentSessionId = sessionId;
    } catch (e) {
      if (e.toString().contains('404') || e.toString().contains('not found')) {
        throw SmaRTCSimpleError('Cet appel n\'existe pas', original: e);
      }
      throw SmaRTCSimpleError('Erreur lors de la connexion: $e', original: e);
    }
  }
  
  /// Termine l'appel en cours
  Future<void> endCall() async {
    if (_currentSessionId == null) return;
    
    try {
      await _client.webrtc.leaveSession();
      _currentSessionId = null;
    } catch (e) {
      throw SmaRTCSimpleError('Erreur lors de la déconnexion: $e', original: e);
    }
  }
  
  /// Active/désactive le micro
  Future<void> toggleMicrophone() async {
    try {
      await _client.webrtc.toggleMicrophone();
    } catch (e) {
      throw SmaRTCSimpleError('Erreur micro: $e', original: e);
    }
  }
  
  /// Active/désactive la caméra
  Future<void> toggleCamera() async {
    try {
      await _client.webrtc.toggleCamera();
    } catch (e) {
      throw SmaRTCSimpleError('Erreur caméra: $e', original: e);
    }
  }
  
  /// Change de caméra (avant/arrière)
  Future<void> switchCamera() async {
    try {
      await _client.webrtc.switchCamera();
    } catch (e) {
      throw SmaRTCSimpleError('Erreur changement de caméra: $e', original: e);
    }
  }
  
  // ==========================================
  // 📋 Sessions disponibles
  // ==========================================
  
  /// Liste tous les appels disponibles
  Future<List<Session>> getAvailableCalls() async {
    try {
      return await _client.sessions.getSessions();
    } catch (e) {
      throw SmaRTCSimpleError('Erreur lors de la récupération: $e', original: e);
    }
  }
  
  /// Récupère les détails d'un appel
  Future<Session> getCallDetails(int sessionId) async {
    try {
      return await _client.sessions.getSession(sessionId);
    } catch (e) {
      if (e.toString().contains('404') || e.toString().contains('not found')) {
        throw SmaRTCSimpleError('Appel introuvable', original: e);
      }
      throw SmaRTCSimpleError('Erreur: $e', original: e);
    }
  }
  
  // ==========================================
  // 🌐 Configuration réseau
  // ==========================================
  
  /// Récupère les serveurs ICE (STUN/TURN) depuis la configuration
  List<Map<String, dynamic>> getIceServers() {
    // Retourne les serveurs ICE configurés
    return SmaRTCClient.config.toIceServersConfig()['iceServers'] as List<Map<String, dynamic>>? ?? [
      {'urls': 'stun:stun.l.google.com:19302'}
    ];
  }
  
  // ==========================================
  // 🎥 Streams vidéo
  // ==========================================
  
  /// Flux vidéo local (peut être null si pas encore initialisé)
  MediaStream? get localVideoStream => _client.webrtc.localStream;
  
  /// Stream de changements du flux local
  Stream<MediaStream?> get localStreamChanges => _client.webrtc.localStreamStream;
  
  /// Map des flux vidéo distants (userId -> MediaStream)
  Map<String, MediaStream> get remoteVideoStreams => _client.webrtc.remoteStreams;
  
  /// Stream des événements de flux distants
  Stream<RemoteStreamEvent> get remoteStreamEvents => _client.webrtc.remoteStreamStream;
  
  /// Stream des participants qui quittent
  Stream<String> get participantLeftEvents => _client.webrtc.participantLeftStream;
}

// ==========================================
// ❌ Erreurs simplifiées et explicites
// ==========================================

/// Erreur générale du SDK simplifié
class SmaRTCSimpleError implements Exception {
  final String message;
  final Object? original;
  
  SmaRTCSimpleError(this.message, {this.original});
  
  @override
  String toString() => 'SmaRTC: $message';
}

/// Erreur d'authentification
class AuthenticationError implements Exception {
  final String message;
  AuthenticationError(this.message);
  @override
  String toString() => 'Authentification: $message';
}

/// Erreur réseau
class NetworkError implements Exception {
  final String message;
  NetworkError(this.message);
  @override
  String toString() => 'Réseau: $message';
}

/// Session non trouvée
class SessionNotFoundError implements Exception {
  final String sessionId;
  SessionNotFoundError(this.sessionId);
  @override
  String toString() => 'Session "$sessionId" introuvable';
}

/// Erreur de session
class SessionError implements Exception {
  final String message;
  SessionError(this.message);
  @override
  String toString() => 'Session: $message';
}

/// Erreur WebRTC
class WebRTCError implements Exception {
  final String message;
  WebRTCError(this.message);
  @override
  String toString() => 'WebRTC: $message';
}
