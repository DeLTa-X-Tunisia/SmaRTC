import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import '../core/config.dart';
import '../core/client.dart';
import '../models/session.dart';
import 'auth_service.dart';

class SessionService {
  final SmaRTCConfig config;
  final AuthService authService;

  SessionService(this.config, this.authService);

  /// Get all sessions
  Future<List<Session>> getSessions() async {
    try {
      final response = await http
          .get(
            Uri.parse('${config.apiUrl}/api/session'),
            headers: authService.getAuthHeaders(),
          )
          .timeout(config.connectionTimeout);

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data
            .map((json) => Session.fromJson(json as Map<String, dynamic>))
            .toList();
      } else {
        throw Exception('Failed to fetch sessions: ${response.statusCode}');
      }
    } catch (e) {
      SmaRTCClient.log('Error fetching sessions: $e', level: Level.error);
      rethrow;
    }
  }

  /// Get session by ID
  Future<Session> getSession(int id) async {
    try {
      final response = await http
          .get(
            Uri.parse('${config.apiUrl}/api/session/$id'),
            headers: authService.getAuthHeaders(),
          )
          .timeout(config.connectionTimeout);

      if (response.statusCode == 200) {
        return Session.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>,
        );
      } else if (response.statusCode == 404) {
        throw Exception('Session not found');
      } else {
        throw Exception('Failed to fetch session: ${response.statusCode}');
      }
    } catch (e) {
      SmaRTCClient.log('Error fetching session: $e', level: Level.error);
      rethrow;
    }
  }

  /// Create a new session
  Future<Session> createSession({
    required String name,
    String? description,
  }) async {
    try {
      final body = {'name': name, 'description': description};

      final response = await http
          .post(
            Uri.parse('${config.apiUrl}/api/session'),
            headers: authService.getAuthHeaders(),
            body: jsonEncode(body),
          )
          .timeout(config.connectionTimeout);

      if (response.statusCode == 201 || response.statusCode == 200) {
        final session = Session.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>,
        );
        SmaRTCClient.log('Session created: ${session.id}');
        return session;
      } else {
        throw Exception('Failed to create session: ${response.statusCode}');
      }
    } catch (e) {
      SmaRTCClient.log('Error creating session: $e', level: Level.error);
      rethrow;
    }
  }

  /// Update a session
  Future<void> updateSession(Session session) async {
    try {
      final response = await http
          .put(
            Uri.parse('${config.apiUrl}/api/session/${session.id}'),
            headers: authService.getAuthHeaders(),
            body: jsonEncode(session.toJson()),
          )
          .timeout(config.connectionTimeout);

      if (response.statusCode == 204 || response.statusCode == 200) {
        SmaRTCClient.log('Session updated: ${session.id}');
      } else {
        throw Exception('Failed to update session: ${response.statusCode}');
      }
    } catch (e) {
      SmaRTCClient.log('Error updating session: $e', level: Level.error);
      rethrow;
    }
  }

  /// Delete a session
  Future<void> deleteSession(int id) async {
    try {
      final response = await http
          .delete(
            Uri.parse('${config.apiUrl}/api/session/$id'),
            headers: authService.getAuthHeaders(),
          )
          .timeout(config.connectionTimeout);

      if (response.statusCode == 204 || response.statusCode == 200) {
        SmaRTCClient.log('Session deleted: $id');
      } else {
        throw Exception('Failed to delete session: ${response.statusCode}');
      }
    } catch (e) {
      SmaRTCClient.log('Error deleting session: $e', level: Level.error);
      rethrow;
    }
  }
}
