import 'user.dart';

class Participant {
  final int id;
  final int sessionId;
  final int userId;
  final User? user;
  final DateTime joinedAt;

  Participant({
    required this.id,
    required this.sessionId,
    required this.userId,
    this.user,
    required this.joinedAt,
  });

  factory Participant.fromJson(Map<String, dynamic> json) {
    return Participant(
      id: json['id'] as int,
      sessionId: json['sessionId'] as int,
      userId: json['userId'] as int,
      user: json['user'] != null
          ? User.fromJson(json['user'] as Map<String, dynamic>)
          : null,
      joinedAt: DateTime.parse(json['joinedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sessionId': sessionId,
      'userId': userId,
      'user': user?.toJson(),
      'joinedAt': joinedAt.toIso8601String(),
    };
  }
}
