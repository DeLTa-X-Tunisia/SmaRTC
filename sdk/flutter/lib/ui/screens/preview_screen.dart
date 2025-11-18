import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../widgets/video_renderer_widget.dart';

class PreviewScreen extends StatefulWidget {
  final VoidCallback? onJoinCall;
  final String? sessionName;

  const PreviewScreen({
    Key? key,
    this.onJoinCall,
    this.sessionName,
  }) : super(key: key);

  @override
  State<PreviewScreen> createState() => _PreviewScreenState();
}

class _PreviewScreenState extends State<PreviewScreen> {
  MediaStream? _localStream;
  bool _isLoading = true;
  bool _isCameraEnabled = true;
  bool _isMicrophoneEnabled = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializePreview();
  }

  @override
  void dispose() {
    _localStream?.dispose();
    super.dispose();
  }

  Future<void> _initializePreview() async {
    try {
      final constraints = {
        'audio': true,
        'video': {
          'facingMode': 'user',
          'width': 1280,
          'height': 720,
        },
      };

      final stream = await navigator.mediaDevices.getUserMedia(constraints);

      setState(() {
        _localStream = stream;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Impossible d\'accéder à la caméra/micro: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleCamera() async {
    if (_localStream == null) return;

    setState(() {
      _isCameraEnabled = !_isCameraEnabled;
    });

    final videoTracks = _localStream!.getVideoTracks();
    for (final track in videoTracks) {
      track.enabled = _isCameraEnabled;
    }
  }

  Future<void> _toggleMicrophone() async {
    if (_localStream == null) return;

    setState(() {
      _isMicrophoneEnabled = !_isMicrophoneEnabled;
    });

    final audioTracks = _localStream!.getAudioTracks();
    for (final track in audioTracks) {
      track.enabled = _isMicrophoneEnabled;
    }
  }

  Future<void> _switchCamera() async {
    if (_localStream == null) return;

    final videoTracks = _localStream!.getVideoTracks();
    if (videoTracks.isNotEmpty) {
      await Helper.switchCamera(videoTracks[0]);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          widget.sessionName ?? 'Prévisualisation',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Vérifiez votre caméra et microphone avant de rejoindre',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),

            // Preview video
            Expanded(
              child: Container(
                margin: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[900],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white24, width: 1),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: _buildPreview(),
                ),
              ),
            ),

            // Controls
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  // Toggle buttons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _PreviewControlButton(
                        icon: _isMicrophoneEnabled ? Icons.mic : Icons.mic_off,
                        label: 'Micro',
                        isActive: _isMicrophoneEnabled,
                        onPressed: _toggleMicrophone,
                      ),
                      const SizedBox(width: 16),
                      _PreviewControlButton(
                        icon: _isCameraEnabled
                            ? Icons.videocam
                            : Icons.videocam_off,
                        label: 'Caméra',
                        isActive: _isCameraEnabled,
                        onPressed: _toggleCamera,
                      ),
                      const SizedBox(width: 16),
                      _PreviewControlButton(
                        icon: Icons.flip_camera_ios,
                        label: 'Switch',
                        isActive: true,
                        onPressed: _switchCamera,
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Join button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed:
                          _localStream != null ? widget.onJoinCall : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        disabledBackgroundColor: Colors.grey[700],
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Rejoindre l\'appel',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPreview() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 48),
              const SizedBox(height: 16),
              Text(
                _error!,
                style: const TextStyle(color: Colors.white),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _initializePreview,
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
      );
    }

    if (_localStream != null) {
      return VideoRendererWidget(
        stream: _localStream,
        mirror: true,
        objectFit: BoxFit.cover,
        showUserName: false,
      );
    }

    return const SizedBox();
  }
}

class _PreviewControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onPressed;

  const _PreviewControlButton({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Material(
          color: isActive ? Colors.white24 : Colors.red.withOpacity(0.3),
          shape: const CircleBorder(),
          child: InkWell(
            onTap: onPressed,
            customBorder: const CircleBorder(),
            child: Container(
              width: 56,
              height: 56,
              alignment: Alignment.center,
              child: Icon(
                icon,
                color: isActive ? Colors.white : Colors.red,
                size: 28,
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.9),
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
