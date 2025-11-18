import 'package:flutter/material.dart';

class CallControls extends StatelessWidget {
  final bool isMicrophoneMuted;
  final bool isCameraEnabled;
  final VoidCallback onToggleMicrophone;
  final VoidCallback onToggleCamera;
  final VoidCallback onSwitchCamera;
  final VoidCallback onEndCall;
  final Color? backgroundColor;
  final Color? activeColor;
  final Color? inactiveColor;

  const CallControls({
    Key? key,
    required this.isMicrophoneMuted,
    required this.isCameraEnabled,
    required this.onToggleMicrophone,
    required this.onToggleCamera,
    required this.onSwitchCamera,
    required this.onEndCall,
    this.backgroundColor,
    this.activeColor,
    this.inactiveColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final bgColor = backgroundColor ?? Colors.black87;
    final activeCol = activeColor ?? Colors.white;
    final inactiveCol = inactiveColor ?? Colors.red;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            // Microphone button
            _ControlButton(
              icon: isMicrophoneMuted ? Icons.mic_off : Icons.mic,
              label: 'Micro',
              isActive: !isMicrophoneMuted,
              activeColor: activeCol,
              inactiveColor: inactiveCol,
              onPressed: onToggleMicrophone,
            ),

            // Camera button
            _ControlButton(
              icon: isCameraEnabled ? Icons.videocam : Icons.videocam_off,
              label: 'Caméra',
              isActive: isCameraEnabled,
              activeColor: activeCol,
              inactiveColor: inactiveCol,
              onPressed: onToggleCamera,
            ),

            // Switch camera button
            _ControlButton(
              icon: Icons.flip_camera_ios,
              label: 'Switch',
              isActive: true,
              activeColor: activeCol,
              inactiveColor: inactiveCol,
              onPressed: onSwitchCamera,
            ),

            // End call button
            _ControlButton(
              icon: Icons.call_end,
              label: 'Raccrocher',
              isActive: false,
              activeColor: Colors.red,
              inactiveColor: Colors.red,
              onPressed: onEndCall,
              isDestructive: true,
            ),
          ],
        ),
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final Color activeColor;
  final Color inactiveColor;
  final VoidCallback onPressed;
  final bool isDestructive;

  const _ControlButton({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.activeColor,
    required this.inactiveColor,
    required this.onPressed,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isActive ? activeColor : inactiveColor;
    final bgColor = isDestructive
        ? Colors.red
        : (isActive ? Colors.white24 : Colors.red.withOpacity(0.3));

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Material(
          color: bgColor,
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
                color: color,
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
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
