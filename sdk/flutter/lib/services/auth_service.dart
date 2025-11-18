import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:logger/logger.dart';
import '../core/config.dart';
import '../core/client.dart';
import '../models/auth_models.dart';

class AuthService {
  final SmaRTCConfig config;
  String? _token;
  String? _username;
  int? _userId;

  AuthService(this.config);

  /// Check if user is authenticated
  bool get isAuthenticated => _token != null;

  /// Get current JWT token
  String? get token => _token;

  /// Get current username
  String? get username => _username;

  /// Get current user ID
  int? get userId => _userId;

  /// Register a new user
  Future<void> register({
    required String username,
    required String password,
    String? role,
  }) async {
    try {
      final model = RegisterModel(
        username: username,
        password: password,
        role: role ?? 'User',
      );

      final response = await http
          .post(
            Uri.parse('${config.apiUrl}/api/auth/register'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(model.toJson()),
          )
          .timeout(config.connectionTimeout);

      if (response.statusCode == 200) {
        SmaRTCClient.log('User registered successfully: $username');
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Registration failed');
      }
    } catch (e) {
      SmaRTCClient.log('Registration error: $e', level: Level.error);
      rethrow;
    }
  }

  /// Login and get JWT token
  Future<void> login({
    required String username,
    required String password,
  }) async {
    try {
      final model = LoginModel(username: username, password: password);

      final response = await http
          .post(
            Uri.parse('${config.apiUrl}/api/auth/login'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(model.toJson()),
          )
          .timeout(config.connectionTimeout);

      if (response.statusCode == 200) {
        final loginResponse = LoginResponse.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>,
        );

        _token = loginResponse.token;
        _username = username;

        // Decode JWT to get user ID
        _userId = _decodeUserId(loginResponse.token);

        // Save to persistent storage
        await _saveCredentials();

        SmaRTCClient.log('User logged in successfully: $username');
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Login failed');
      }
    } catch (e) {
      SmaRTCClient.log('Login error: $e', level: Level.error);
      rethrow;
    }
  }

  /// Logout and clear session
  Future<void> logout() async {
    _token = null;
    _username = null;
    _userId = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('smartc_token');
    await prefs.remove('smartc_username');

    SmaRTCClient.log('User logged out');
  }

  /// Restore session from storage
  Future<bool> restoreSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('smartc_token');
      final username = prefs.getString('smartc_username');

      if (token != null && username != null) {
        _token = token;
        _username = username;
        _userId = _decodeUserId(token);

        SmaRTCClient.log('Session restored for: $username');
        return true;
      }

      return false;
    } catch (e) {
      SmaRTCClient.log('Failed to restore session: $e', level: Level.error);
      return false;
    }
  }

  /// Save credentials to persistent storage
  Future<void> _saveCredentials() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('smartc_token', _token!);
    await prefs.setString('smartc_username', _username!);
  }

  /// Decode user ID from JWT token
  int? _decodeUserId(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;

      final payload = parts[1];
      final normalized = base64Url.normalize(payload);
      final decoded = utf8.decode(base64Url.decode(normalized));
      final Map<String, dynamic> json = jsonDecode(decoded);

      // JWT uses 'sub' claim for subject (user ID)
      final sub = json['sub'] ?? json['nameid'];
      return sub != null ? int.tryParse(sub.toString()) : null;
    } catch (e) {
      SmaRTCClient.log('Failed to decode user ID: $e', level: Level.error);
      return null;
    }
  }

  /// Get authorization header
  Map<String, String> getAuthHeaders() {
    if (_token == null) {
      throw Exception('Not authenticated');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $_token',
    };
  }
}
