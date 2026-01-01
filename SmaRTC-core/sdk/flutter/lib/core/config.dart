class SmaRTCConfig {
  final String apiUrl;
  final String signalServerUrl;
  final List<String> stunServers;
  final List<TurnServer> turnServers;
  final Duration connectionTimeout;
  final bool enableLogging;

  SmaRTCConfig({
    required this.apiUrl,
    required this.signalServerUrl,
    this.stunServers = const ['stun:stun.l.google.com:19302'],
    this.turnServers = const [],
    this.connectionTimeout = const Duration(seconds: 30),
    this.enableLogging = true,
  });

  Map<String, dynamic> toIceServersConfig() {
    final iceServers = <Map<String, dynamic>>[];

    // Add STUN servers
    for (final stun in stunServers) {
      iceServers.add({'urls': stun});
    }

    // Add TURN servers
    for (final turn in turnServers) {
      iceServers.add({
        'urls': turn.url,
        'username': turn.username,
        'credential': turn.credential,
      });
    }

    return {'iceServers': iceServers};
  }
}

class TurnServer {
  final String url;
  final String username;
  final String credential;

  const TurnServer({
    required this.url,
    required this.username,
    required this.credential,
  });
}
