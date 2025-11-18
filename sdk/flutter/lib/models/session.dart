import 'user.dart';
import 'participant.dart';

class Session {
  final int id;
  final String? name;
  final String? description;
  final int creatorId;
  final User? creator;
  final DateTime createdAt;
  final List<Participant> participants;

  Session({
    required this.id,
    this.name,
    this.description,
    required this.creatorId,
    this.creator,
    required this.createdAt,
    this.participants = const [],
  });

  factory Session.fromJson(Map<String, dynamic> json) {
    return Session(
      id: json['id'] as int,
      name: json['name'] as String?,
      description: json['description'] as String?,
      creatorId: json['creatorId'] as int,
      creator: json['creator'] != null
          ? User.fromJson(json['creator'] as Map<String, dynamic>)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      participants:
          (json['participants'] as List<dynamic>?)
              ?.map((p) => Participant.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'creatorId': creatorId,
      'creator': creator?.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'participants': participants.map((p) => p.toJson()).toList(),
    };
  }
}
