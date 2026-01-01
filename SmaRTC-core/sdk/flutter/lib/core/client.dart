import 'package:logger/logger.dart';
import '../services/auth_service.dart';
import '../services/session_service.dart';
import '../services/signalr_service.dart';
import '../services/webrtc_service.dart';
import 'config.dart';

class SmaRTCClient {
  static SmaRTCClient? _instance;
  static SmaRTCConfig? _config;
  static Logger? _logger;

  late final AuthService auth;
  late final SessionService sessions;
  late final SignalRService signaling;
  late final WebRTCService webrtc;

  SmaRTCClient._internal(SmaRTCConfig config) {
    _config = config;
    _logger = config.enableLogging
        ? Logger(
            printer: PrettyPrinter(
              methodCount: 0,
              errorMethodCount: 5,
              lineLength: 80,
              colors: true,
              printEmojis: true,
              printTime: true,
            ),
          )
        : null;

    // Initialize services
    auth = AuthService(config);
    sessions = SessionService(config, auth);
    signaling = SignalRService(config);
    webrtc = WebRTCService(config, signaling);
  }

  /// Initialize the SDK with configuration
  static Future<void> initialize(SmaRTCConfig config) async {
    _instance = SmaRTCClient._internal(config);
    log('SmaRTC SDK initialized successfully');
  }

  /// Get the singleton instance
  static SmaRTCClient get instance {
    if (_instance == null) {
      throw Exception(
        'SmaRTCClient not initialized. Call SmaRTCClient.initialize() first.',
      );
    }
    return _instance!;
  }

  /// Check if SDK is initialized
  static bool get isInitialized => _instance != null;

  /// Get configuration
  static SmaRTCConfig get config {
    if (_config == null) {
      throw Exception('SmaRTCClient not initialized');
    }
    return _config!;
  }

  /// Log helper
  static void log(String message, {Level level = Level.info}) {
    _logger?.log(level, message);
  }

  /// Dispose all services
  Future<void> dispose() async {
    await webrtc.dispose();
    await signaling.dispose();
    log('SmaRTC SDK disposed');
  }
}
