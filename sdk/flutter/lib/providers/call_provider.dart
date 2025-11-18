import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:logger/logger.dart';
import '../core/client.dart';
import '../services/webrtc_service.dart';
import '../services/signalr_service.dart';

class CallProvider with ChangeNotifier {
  final WebRTCService webrtcService;
  final SignalRService signalingService;

  MediaStream? _localStream;
  final Map<String, MediaStream> _remoteStreams = {};
  final Map<String, ParticipantInfo> _participants = {};

  bool _isMicrophoneMuted = false;
  bool _isCameraEnabled = true;
  bool _isInCall = false;
  int? _currentSessionId;
  SignalRConnectionState _connectionState = SignalRConnectionState.disconnected;

  CallProvider({
    required this.webrtcService,
    required this.signalingService,
  }) {
    _setupListeners();
  }

  // Getters
  MediaStream? get localStream => _localStream;
  Map<String, MediaStream> get remoteStreams =>
      Map.unmodifiable(_remoteStreams);
  Map<String, ParticipantInfo> get participants =>
      Map.unmodifiable(_participants);
  bool get isMicrophoneMuted => _isMicrophoneMuted;
  bool get isCameraEnabled => _isCameraEnabled;
  bool get isInCall => _isInCall;
  int? get currentSessionId => _currentSessionId;
  SignalRConnectionState get connectionState => _connectionState;

  /// Join a call session
  Future<void> joinCall(int sessionId) async {
    try {
      await webrtcService.joinSession(sessionId);
      _currentSessionId = sessionId;
      _isInCall = true;
      notifyListeners();
    } catch (e) {
      SmaRTCClient.log('Failed to join call: $e', level: Level.error);
      rethrow;
    }
  }

  /// Leave the current call
  Future<void> leaveCall() async {
    try {
      await webrtcService.leaveSession();

      _localStream = null;
      _remoteStreams.clear();
      _participants.clear();
      _currentSessionId = null;
      _isInCall = false;
      _isMicrophoneMuted = false;
      _isCameraEnabled = true;

      notifyListeners();
    } catch (e) {
      SmaRTCClient.log('Failed to leave call: $e', level: Level.error);
      rethrow;
    }
  }

  /// Toggle microphone
  Future<void> toggleMicrophone() async {
    await webrtcService.toggleMicrophone();
    _isMicrophoneMuted = webrtcService.isMicrophoneMuted;
    notifyListeners();
  }

  /// Toggle camera
  Future<void> toggleCamera() async {
    await webrtcService.toggleCamera();
    _isCameraEnabled = webrtcService.isCameraEnabled;
    notifyListeners();
  }

  /// Switch camera
  Future<void> switchCamera() async {
    await webrtcService.switchCamera();
  }

  /// Setup event listeners
  void _setupListeners() {
    // Local stream updates
    webrtcService.localStreamStream.listen((stream) {
      _localStream = stream;
      notifyListeners();
    });

    // Remote stream updates
    webrtcService.remoteStreamStream.listen((event) {
      if (event.isAdded && event.stream != null) {
        _remoteStreams[event.username] = event.stream!;
        _participants[event.username] = ParticipantInfo(
          username: event.username,
          joinedAt: DateTime.now(),
        );
      } else {
        _remoteStreams.remove(event.username);
        _participants.remove(event.username);
      }
      notifyListeners();
    });

    // Participant left
    webrtcService.participantLeftStream.listen((username) {
      _remoteStreams.remove(username);
      _participants.remove(username);
      notifyListeners();
    });

    // Connection state changes
    signalingService.stateStream.listen((state) {
      _connectionState = state;
      notifyListeners();
    });
  }

  @override
  void dispose() {
    leaveCall();
    super.dispose();
  }
}

class ParticipantInfo {
  final String username;
  final DateTime joinedAt;

  ParticipantInfo({
    required this.username,
    required this.joinedAt,
  });
}
