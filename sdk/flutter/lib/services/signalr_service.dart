import 'dart:async';
import 'package:signalr_netcore/signalr_client.dart';
import 'package:logger/logger.dart';
import '../core/config.dart';
import '../core/client.dart';

enum SignalRConnectionState {
  disconnected,
  connecting,
  connected,
  reconnecting,
}

class SignalRService {
  final SmaRTCConfig config;
  HubConnection? _connection;

  SignalRConnectionState _state = SignalRConnectionState.disconnected;

  // Event streams
  final _stateController = StreamController<SignalRConnectionState>.broadcast();
  final _newUserController = StreamController<String>.broadcast();
  final _signalController = StreamController<SignalData>.broadcast();

  SignalRService(this.config);

  /// Get connection state
  SignalRConnectionState get state => _state;

  /// Stream of connection state changes
  Stream<SignalRConnectionState> get stateStream => _stateController.stream;

  /// Stream of new user arrivals
  Stream<String> get newUserStream => _newUserController.stream;

  /// Stream of WebRTC signals (offer, answer, ice-candidate)
  Stream<SignalData> get signalStream => _signalController.stream;

  /// Connect to SignalR hub
  Future<void> connect() async {
    if (_state == SignalRConnectionState.connected ||
        _state == SignalRConnectionState.connecting) {
      SmaRTCClient.log('SignalR already connected or connecting');
      return;
    }

    try {
      _updateState(SignalRConnectionState.connecting);

      _connection = HubConnectionBuilder()
          .withUrl(config.signalServerUrl)
          .withAutomaticReconnect()
          .build();

      // Register event handlers
      _connection!.on('NewUserArrived', _handleNewUserArrived);
      _connection!.on('SendSignal', _handleSendSignal);

      // Connection state handlers
      _connection!.onclose(({error}) {
        SmaRTCClient.log('SignalR connection closed: $error');
        _updateState(SignalRConnectionState.disconnected);
      });

      _connection!.onreconnecting(({error}) {
        SmaRTCClient.log('SignalR reconnecting: $error');
        _updateState(SignalRConnectionState.reconnecting);
      });

      _connection!.onreconnected(({connectionId}) {
        SmaRTCClient.log('SignalR reconnected: $connectionId');
        _updateState(SignalRConnectionState.connected);
      });

      await _connection!.start();
      _updateState(SignalRConnectionState.connected);

      SmaRTCClient.log('SignalR connected successfully');
    } catch (e) {
      _updateState(SignalRConnectionState.disconnected);
      SmaRTCClient.log('SignalR connection error: $e', level: Level.error);
      rethrow;
    }
  }

  /// Disconnect from SignalR hub
  Future<void> disconnect() async {
    if (_connection != null) {
      await _connection!.stop();
      _connection = null;
      _updateState(SignalRConnectionState.disconnected);
      SmaRTCClient.log('SignalR disconnected');
    }
  }

  /// Join a session/room
  Future<void> joinSession(String sessionId, String username) async {
    _ensureConnected();

    try {
      await _connection!.invoke('JoinSession', args: [sessionId, username]);
      SmaRTCClient.log('Joined session: $sessionId as $username');
    } catch (e) {
      SmaRTCClient.log('Failed to join session: $e', level: Level.error);
      rethrow;
    }
  }

  /// Leave a session/room
  Future<void> leaveSession(String sessionId, String username) async {
    _ensureConnected();

    try {
      await _connection!.invoke('LeaveSession', args: [sessionId, username]);
      SmaRTCClient.log('Left session: $sessionId');
    } catch (e) {
      SmaRTCClient.log('Failed to leave session: $e', level: Level.error);
      rethrow;
    }
  }

  /// Announce new user to all peers
  Future<void> announceNewUser(String username) async {
    _ensureConnected();

    try {
      await _connection!.invoke('NewUser', args: [username]);
      SmaRTCClient.log('Announced new user: $username');
    } catch (e) {
      SmaRTCClient.log('Failed to announce user: $e', level: Level.error);
      rethrow;
    }
  }

  /// Send WebRTC signal (offer, answer, ice-candidate) to other peers
  Future<void> sendSignal(String signal, String user) async {
    _ensureConnected();

    try {
      await _connection!.invoke('SendSignal', args: [signal, user]);
      SmaRTCClient.log('Sent signal to $user');
    } catch (e) {
      SmaRTCClient.log('Failed to send signal: $e', level: Level.error);
      rethrow;
    }
  }

  /// Send WebRTC signal to specific session
  Future<void> sendSignalToSession(String sessionId, String signal, String user) async {
    _ensureConnected();

    try {
      await _connection!.invoke('SendSignalToSession', args: [sessionId, signal, user]);
      SmaRTCClient.log('Sent signal to session $sessionId from $user');
    } catch (e) {
      SmaRTCClient.log('Failed to send signal to session: $e', level: Level.error);
      rethrow;
    }
  }

  /// Handle new user arrived event
  void _handleNewUserArrived(List<Object?>? arguments) {
    if (arguments != null && arguments.isNotEmpty) {
      final username = arguments[0] as String;
      SmaRTCClient.log('New user arrived: $username');
      _newUserController.add(username);
    }
  }

  /// Handle signal received event
  void _handleSendSignal(List<Object?>? arguments) {
    if (arguments != null && arguments.length >= 2) {
      final signal = arguments[0] as String;
      final user = arguments[1] as String;

      SmaRTCClient.log('Received signal from: $user');
      _signalController.add(SignalData(signal: signal, user: user));
    }
  }

  /// Update connection state
  void _updateState(SignalRConnectionState newState) {
    _state = newState;
    _stateController.add(newState);
  }

  /// Ensure connection is established
  void _ensureConnected() {
    if (_state != SignalRConnectionState.connected) {
      throw Exception('SignalR not connected');
    }
  }

  /// Dispose and cleanup
  Future<void> dispose() async {
    await disconnect();
    await _stateController.close();
    await _newUserController.close();
    await _signalController.close();
  }
}

class SignalData {
  final String signal;
  final String user;

  SignalData({required this.signal, required this.user});
}
