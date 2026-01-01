import 'dart:async';
import 'dart:convert';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:logger/logger.dart';
import '../core/config.dart';
import '../core/client.dart';
import 'signalr_service.dart';

class WebRTCService {
  final SmaRTCConfig config;
  final SignalRService signaling;

  MediaStream? _localStream;
  final Map<String, MediaStream> _remoteStreams = {};
  final Map<String, RTCPeerConnection> _peerConnections = {};

  bool _isMicrophoneMuted = false;
  bool _isCameraEnabled = true;

  // Event streams
  final _localStreamController = StreamController<MediaStream?>.broadcast();
  final _remoteStreamController =
      StreamController<RemoteStreamEvent>.broadcast();
  final _participantLeftController = StreamController<String>.broadcast();

  WebRTCService(this.config, this.signaling) {
    _setupSignalingListeners();
  }

  /// Get local media stream
  MediaStream? get localStream => _localStream;

  /// Get all remote streams
  Map<String, MediaStream> get remoteStreams =>
      Map.unmodifiable(_remoteStreams);

  /// Stream of local stream changes
  Stream<MediaStream?> get localStreamStream => _localStreamController.stream;

  /// Stream of remote stream events
  Stream<RemoteStreamEvent> get remoteStreamStream =>
      _remoteStreamController.stream;

  /// Stream of participant left events
  Stream<String> get participantLeftStream => _participantLeftController.stream;

  /// Check if microphone is muted
  bool get isMicrophoneMuted => _isMicrophoneMuted;

  /// Check if camera is enabled
  bool get isCameraEnabled => _isCameraEnabled;

  int? _currentSessionId;

  /// Join a session and start call
  Future<void> joinSession(int sessionId) async {
    try {
      _currentSessionId = sessionId;

      // Initialize local media stream
      await _initializeLocalStream();

      // Connect to signaling server
      await signaling.connect();

      // Join the session room
      final username = SmaRTCClient.instance.auth.username ?? 'Anonymous';
      await signaling.joinSession(sessionId.toString(), username);

      SmaRTCClient.log('Joined session: $sessionId');
    } catch (e) {
      SmaRTCClient.log('Failed to join session: $e', level: Level.error);
      rethrow;
    }
  }

  /// Leave the current session
  Future<void> leaveSession() async {
    try {
      // Leave the session room
      if (_currentSessionId != null) {
        final username = SmaRTCClient.instance.auth.username ?? 'Anonymous';
        await signaling.leaveSession(_currentSessionId.toString(), username);
      }

      // Close all peer connections
      for (final pc in _peerConnections.values) {
        await pc.close();
      }
      _peerConnections.clear();

      // Stop local stream
      await _localStream?.dispose();
      _localStream = null;

      // Clear remote streams
      for (final stream in _remoteStreams.values) {
        await stream.dispose();
      }
      _remoteStreams.clear();

      // Disconnect signaling
      await signaling.disconnect();

      _localStreamController.add(null);
      _currentSessionId = null;
      SmaRTCClient.log('Left session');
    } catch (e) {
      SmaRTCClient.log('Error leaving session: $e', level: Level.error);
      rethrow;
    }
  }

  /// Toggle microphone on/off
  Future<void> toggleMicrophone() async {
    if (_localStream == null) return;

    _isMicrophoneMuted = !_isMicrophoneMuted;

    final audioTracks = _localStream!.getAudioTracks();
    for (final track in audioTracks) {
      track.enabled = !_isMicrophoneMuted;
    }

    SmaRTCClient.log('Microphone ${_isMicrophoneMuted ? "muted" : "unmuted"}');
  }

  /// Toggle camera on/off
  Future<void> toggleCamera() async {
    if (_localStream == null) return;

    _isCameraEnabled = !_isCameraEnabled;

    final videoTracks = _localStream!.getVideoTracks();
    for (final track in videoTracks) {
      track.enabled = _isCameraEnabled;
    }

    SmaRTCClient.log('Camera ${_isCameraEnabled ? "enabled" : "disabled"}');
  }

  /// Switch between front and back camera
  Future<void> switchCamera() async {
    if (_localStream == null) return;

    final videoTracks = _localStream!.getVideoTracks();
    if (videoTracks.isNotEmpty) {
      await Helper.switchCamera(videoTracks[0]);
      SmaRTCClient.log('Camera switched');
    }
  }

  /// Initialize local media stream
  Future<void> _initializeLocalStream() async {
    try {
      final constraints = {
        'audio': true,
        'video': {'facingMode': 'user', 'width': 1280, 'height': 720},
      };

      _localStream = await navigator.mediaDevices.getUserMedia(constraints);
      _localStreamController.add(_localStream);

      SmaRTCClient.log('Local stream initialized');
    } catch (e) {
      SmaRTCClient.log('Failed to get user media: $e', level: Level.error);
      rethrow;
    }
  }

  /// Setup signaling event listeners
  void _setupSignalingListeners() {
    // Listen for new users joining
    signaling.newUserStream.listen((username) async {
      SmaRTCClient.log('New peer detected: $username');
      await _createPeerConnection(username, true);
    });

    // Listen for WebRTC signals
    signaling.signalStream.listen((signalData) async {
      await _handleSignal(signalData);
    });
  }

  /// Create peer connection for a user
  Future<void> _createPeerConnection(String username, bool isInitiator) async {
    try {
      final configuration = config.toIceServersConfig();
      final pc = await createPeerConnection(configuration);

      _peerConnections[username] = pc;

      // Add local stream tracks
      if (_localStream != null) {
        _localStream!.getTracks().forEach((track) {
          pc.addTrack(track, _localStream!);
        });
      }

      // Handle remote stream
      pc.onTrack = (event) {
        if (event.streams.isNotEmpty) {
          final stream = event.streams[0];
          _remoteStreams[username] = stream;
          _remoteStreamController.add(
            RemoteStreamEvent(
              username: username,
              stream: stream,
              isAdded: true,
            ),
          );
          SmaRTCClient.log('Remote stream added for: $username');
        }
      };

      // Handle ICE candidates
      pc.onIceCandidate = (candidate) async {
        final signal = jsonEncode({
          'type': 'ice-candidate',
          'candidate': candidate.toMap(),
        });
        if (_currentSessionId != null) {
          await signaling.sendSignalToSession(_currentSessionId.toString(), signal, username);
        } else {
          await signaling.sendSignal(signal, username);
        }
      };

      // Handle connection state changes
      pc.onConnectionState = (state) {
        SmaRTCClient.log('Connection state for $username: $state');

        if (state == RTCPeerConnectionState.RTCPeerConnectionStateFailed ||
            state == RTCPeerConnectionState.RTCPeerConnectionStateClosed) {
          _handlePeerDisconnected(username);
        }
      };

      // If initiator, create and send offer
      if (isInitiator) {
        final offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        final signal = jsonEncode({'type': 'offer', 'sdp': offer.toMap()});
        if (_currentSessionId != null) {
          await signaling.sendSignalToSession(_currentSessionId.toString(), signal, username);
        } else {
          await signaling.sendSignal(signal, username);
        }

        SmaRTCClient.log('Offer sent to: $username');
      }
    } catch (e) {
      SmaRTCClient.log(
        'Failed to create peer connection: $e',
        level: Level.error,
      );
      rethrow;
    }
  }

  /// Handle incoming WebRTC signals
  Future<void> _handleSignal(SignalData signalData) async {
    try {
      final data = jsonDecode(signalData.signal) as Map<String, dynamic>;
      final type = data['type'] as String;
      final username = signalData.user;

      switch (type) {
        case 'offer':
          await _handleOffer(username, data['sdp'] as Map<String, dynamic>);
          break;
        case 'answer':
          await _handleAnswer(username, data['sdp'] as Map<String, dynamic>);
          break;
        case 'ice-candidate':
          await _handleIceCandidate(
            username,
            data['candidate'] as Map<String, dynamic>,
          );
          break;
      }
    } catch (e) {
      SmaRTCClient.log('Error handling signal: $e', level: Level.error);
    }
  }

  /// Handle incoming offer
  Future<void> _handleOffer(
    String username,
    Map<String, dynamic> sdpMap,
  ) async {
    try {
      // Create peer connection if not exists
      if (!_peerConnections.containsKey(username)) {
        await _createPeerConnection(username, false);
      }

      final pc = _peerConnections[username]!;
      final offer = RTCSessionDescription(sdpMap['sdp'], sdpMap['type']);

      await pc.setRemoteDescription(offer);

      // Create and send answer
      final answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      final signal = jsonEncode({'type': 'answer', 'sdp': answer.toMap()});
      if (_currentSessionId != null) {
        await signaling.sendSignalToSession(_currentSessionId.toString(), signal, username);
      } else {
        await signaling.sendSignal(signal, username);
      }

      SmaRTCClient.log('Answer sent to: $username');
    } catch (e) {
      SmaRTCClient.log('Error handling offer: $e', level: Level.error);
    }
  }

  /// Handle incoming answer
  Future<void> _handleAnswer(
    String username,
    Map<String, dynamic> sdpMap,
  ) async {
    try {
      final pc = _peerConnections[username];
      if (pc != null) {
        final answer = RTCSessionDescription(sdpMap['sdp'], sdpMap['type']);
        await pc.setRemoteDescription(answer);
        SmaRTCClient.log('Answer received from: $username');
      }
    } catch (e) {
      SmaRTCClient.log('Error handling answer: $e', level: Level.error);
    }
  }

  /// Handle incoming ICE candidate
  Future<void> _handleIceCandidate(
    String username,
    Map<String, dynamic> candidateMap,
  ) async {
    try {
      final pc = _peerConnections[username];
      if (pc != null) {
        final candidate = RTCIceCandidate(
          candidateMap['candidate'],
          candidateMap['sdpMid'],
          candidateMap['sdpMLineIndex'],
        );
        await pc.addCandidate(candidate);
        SmaRTCClient.log('ICE candidate added for: $username');
      }
    } catch (e) {
      SmaRTCClient.log('Error handling ICE candidate: $e', level: Level.error);
    }
  }

  /// Handle peer disconnection
  void _handlePeerDisconnected(String username) {
    _peerConnections.remove(username);

    final stream = _remoteStreams.remove(username);
    if (stream != null) {
      stream.dispose();
      _remoteStreamController.add(
        RemoteStreamEvent(username: username, stream: null, isAdded: false),
      );
    }

    _participantLeftController.add(username);
    SmaRTCClient.log('Peer disconnected: $username');
  }

  /// Dispose and cleanup
  Future<void> dispose() async {
    await leaveSession();
    await _localStreamController.close();
    await _remoteStreamController.close();
    await _participantLeftController.close();
  }
}

class RemoteStreamEvent {
  final String username;
  final MediaStream? stream;
  final bool isAdded;

  RemoteStreamEvent({
    required this.username,
    required this.stream,
    required this.isAdded,
  });
}
