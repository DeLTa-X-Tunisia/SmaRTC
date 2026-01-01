# SmaRTC Flutter SDK - Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-11-18

### Added
- ✨ Initial release of SmaRTC Flutter SDK
- 🔐 JWT authentication support (login, register, logout)
- 📞 WebRTC peer-to-peer calling
- 🎥 Session management (create, list, join, delete)
- 💬 SignalR real-time signaling
- 🎨 Pre-built UI components:
  - CallScreen: Full-featured call screen with participant grid
  - PreviewScreen: Camera/microphone preview before joining
  - ParticipantGrid: Responsive grid layout for multiple participants
  - CallControls: Mute, camera, switch camera, and end call buttons
  - VideoRendererWidget: WebRTC video renderer with user labels
- 📱 Multi-platform support (Android, iOS, Web)
- 🧩 Provider-based state management
- 📖 Complete documentation and example app
- 🧪 Example app with full authentication and session flow

### Features
- Multi-party video calls with automatic grid layout
- Audio/video track control (mute, enable/disable camera)
- Front/back camera switching
- Automatic ICE candidate negotiation
- Connection state monitoring
- Session persistence with SharedPreferences
- Comprehensive error handling
- Logging with different levels

### Technical
- flutter_webrtc: ^0.11.7 for WebRTC support
- signalr_netcore: ^1.3.7 for SignalR communication
- provider: ^6.1.1 for state management
- http: ^1.2.0 for REST API calls
- JWT token handling with automatic header injection
