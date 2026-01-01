import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'video_renderer_widget.dart';

class ParticipantGrid extends StatelessWidget {
  final Map<String, MediaStream> remoteStreams;
  final MediaStream? localStream;
  final bool showLocalStream;

  const ParticipantGrid({
    Key? key,
    required this.remoteStreams,
    this.localStream,
    this.showLocalStream = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final allStreams = <String, MediaStream>{
      ...remoteStreams,
      if (showLocalStream && localStream != null) 'You': localStream!,
    };

    if (allStreams.isEmpty) {
      return const Center(
        child: Text(
          'En attente des participants...',
          style: TextStyle(color: Colors.white70, fontSize: 16),
        ),
      );
    }

    // Single participant - full screen
    if (allStreams.length == 1) {
      final entry = allStreams.entries.first;
      return VideoRendererWidget(
        stream: entry.value,
        mirror: entry.key == 'You',
        objectFit: BoxFit.cover,
        userName: entry.key,
      );
    }

    // Two participants - split screen
    if (allStreams.length == 2) {
      return Column(
        children: allStreams.entries.map((entry) {
          return Expanded(
            child: VideoRendererWidget(
              stream: entry.value,
              mirror: entry.key == 'You',
              objectFit: BoxFit.cover,
              userName: entry.key,
            ),
          );
        }).toList(),
      );
    }

    // 3-4 participants - 2x2 grid
    if (allStreams.length <= 4) {
      return GridView.builder(
        padding: EdgeInsets.zero,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 1.0,
        ),
        itemCount: allStreams.length,
        itemBuilder: (context, index) {
          final entry = allStreams.entries.elementAt(index);
          return VideoRendererWidget(
            stream: entry.value,
            mirror: entry.key == 'You',
            objectFit: BoxFit.cover,
            userName: entry.key,
          );
        },
      );
    }

    // 5+ participants - 3 columns grid
    return GridView.builder(
      padding: EdgeInsets.zero,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 0.75,
      ),
      itemCount: allStreams.length,
      itemBuilder: (context, index) {
        final entry = allStreams.entries.elementAt(index);
        return VideoRendererWidget(
          stream: entry.value,
          mirror: entry.key == 'You',
          objectFit: BoxFit.cover,
          userName: entry.key,
        );
      },
    );
  }
}
