import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

class VideoRendererWidget extends StatefulWidget {
  final MediaStream? stream;
  final bool mirror;
  final BoxFit objectFit;
  final String? userName;
  final bool showUserName;

  const VideoRendererWidget({
    Key? key,
    required this.stream,
    this.mirror = false,
    this.objectFit = BoxFit.cover,
    this.userName,
    this.showUserName = true,
  }) : super(key: key);

  @override
  State<VideoRendererWidget> createState() => _VideoRendererWidgetState();
}

class _VideoRendererWidgetState extends State<VideoRendererWidget> {
  final RTCVideoRenderer _renderer = RTCVideoRenderer();
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _initRenderer();
  }

  @override
  void didUpdateWidget(VideoRendererWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.stream != oldWidget.stream) {
      _updateStream();
    }
  }

  @override
  void dispose() {
    _renderer.dispose();
    super.dispose();
  }

  Future<void> _initRenderer() async {
    await _renderer.initialize();
    setState(() {
      _isInitialized = true;
    });
    _updateStream();
  }

  void _updateStream() {
    if (_isInitialized) {
      _renderer.srcObject = widget.stream;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized || widget.stream == null) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Stack(
      children: [
        Container(
          color: Colors.black,
          child: Transform(
            alignment: Alignment.center,
            transform: Matrix4.identity()
              ..scale(widget.mirror ? -1.0 : 1.0, 1.0),
            child: RTCVideoView(
              _renderer,
              objectFit: widget.objectFit == BoxFit.cover
                  ? RTCVideoViewObjectFit.RTCVideoViewObjectFitCover
                  : RTCVideoViewObjectFit.RTCVideoViewObjectFitContain,
              mirror: false, // We handle mirroring with Transform
            ),
          ),
        ),
        if (widget.showUserName && widget.userName != null)
          Positioned(
            bottom: 8,
            left: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                widget.userName!,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
