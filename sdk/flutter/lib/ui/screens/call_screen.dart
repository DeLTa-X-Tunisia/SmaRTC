import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/call_provider.dart';
import '../widgets/participant_grid.dart';
import '../widgets/call_controls.dart';

class CallScreen extends StatefulWidget {
  final int sessionId;
  final VoidCallback? onCallEnded;
  final String? sessionName;

  const CallScreen({
    Key? key,
    required this.sessionId,
    this.onCallEnded,
    this.sessionName,
  }) : super(key: key);

  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  bool _isJoining = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _joinCall();

    // Set portrait orientation for better UX
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
  }

  @override
  void dispose() {
    // Reset orientation
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    super.dispose();
  }

  Future<void> _joinCall() async {
    try {
      final callProvider = Provider.of<CallProvider>(context, listen: false);
      await callProvider.joinCall(widget.sessionId);

      setState(() {
        _isJoining = false;
      });
    } catch (e) {
      setState(() {
        _isJoining = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _endCall() async {
    try {
      final callProvider = Provider.of<CallProvider>(context, listen: false);
      await callProvider.leaveCall();

      if (mounted) {
        widget.onCallEnded?.call();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error ending call: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isJoining) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(color: Colors.white),
              const SizedBox(height: 24),
              Text(
                'Connexion en cours...',
                style: TextStyle(
                    color: Colors.white.withOpacity(0.8), fontSize: 16),
              ),
            ],
          ),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, color: Colors.red, size: 64),
                const SizedBox(height: 16),
                Text(
                  'Erreur de connexion',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _error!,
                  style: TextStyle(color: Colors.white.withOpacity(0.7)),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => widget.onCallEnded?.call(),
                  child: const Text('Retour'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Consumer<CallProvider>(
        builder: (context, callProvider, child) {
          return Stack(
            children: [
              // Participant grid
              Positioned.fill(
                child: ParticipantGrid(
                  remoteStreams: callProvider.remoteStreams,
                  localStream: callProvider.localStream,
                  showLocalStream: true,
                ),
              ),

              // Top bar with session info
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withOpacity(0.7),
                        Colors.transparent,
                      ],
                    ),
                  ),
                  child: SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.sessionName ??
                                'Session #${widget.sessionId}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Colors.green,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '${callProvider.participants.length + 1} participant(s)',
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.8),
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // Bottom controls
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: CallControls(
                  isMicrophoneMuted: callProvider.isMicrophoneMuted,
                  isCameraEnabled: callProvider.isCameraEnabled,
                  onToggleMicrophone: callProvider.toggleMicrophone,
                  onToggleCamera: callProvider.toggleCamera,
                  onSwitchCamera: callProvider.switchCamera,
                  onEndCall: _endCall,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
