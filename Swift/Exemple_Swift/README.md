# SmaRTC Swift SDK Example 🍎

[![Swift](https://img.shields.io/badge/Swift-5.9-orange.svg)](https://swift.org)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20iOS-lightgrey.svg)](https://developer.apple.com)
[![SignalR](https://img.shields.io/badge/SignalR-Client-blue.svg)](https://github.com/moozzyk/SignalR-Client-Swift)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](../../LICENSE)

> **⚠️ Portfolio Only**: This Swift example is provided as reference code for portfolio purposes. It requires macOS with Xcode to build and run.

## 📋 Requirements

- **macOS** 13.0+ or **iOS** 16.0+
- **Xcode** 15.0+
- **Swift** 5.9+
- **Swift Package Manager**

## 🏗️ Project Structure

```
Swift/Exemple_Swift/
├── Package.swift                    # Swift Package Manager manifest
├── Sources/
│   ├── Main.swift                   # Chat application entry point
│   └── SDK/
│       └── SmaRTCClient.swift       # SignalR client wrapper
└── README.md
```

## 🔧 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| SignalR-Client-Swift | 0.9.0+ | Real-time SignalR communication |

## 🚀 Building (macOS only)

```bash
# Navigate to project directory
cd Swift/Exemple_Swift

# Build the project
swift build

# Run the application
swift run
```

## 📱 iOS Integration

To use the SDK in an iOS app:

```swift
import SignalRClient

// Initialize the client
let client = SmaRTCClient(hubUrl: "http://your-server:5001/signalhub")

// Set up callbacks
client.onSignalReceived = { user, message in
    print("Message from \(user): \(message)")
}

client.onUserJoined = { user in
    print("\(user) joined the chat")
}

// Connect and join a room
client.connect()
client.joinRoom(room: "my-room", user: "SwiftUser")

// Send a message
client.sendMessage("Hello from Swift!")

// Disconnect when done
client.disconnect()
```

## 🎨 SDK Features

- ✅ **Connect/Disconnect** - Manage hub connection
- ✅ **Join/Leave Room** - Room-based messaging
- ✅ **Send Messages** - Real-time message delivery
- ✅ **Event Callbacks** - User join/leave notifications
- ✅ **Auto Reconnect** - Automatic reconnection handling
- ✅ **Error Handling** - Comprehensive error callbacks

## 📝 SignalR Hub Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `JoinSession` | `(sessionId, username)` | Join a chat room |
| `LeaveSession` | `(sessionId, username)` | Leave a chat room |
| `SendSignalToSession` | `(sessionId, signal, username)` | Send message to room |

## 📡 SignalR Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `SendSignal` | `(user, message)` | Incoming message |
| `NewUserArrived` | `(username)` | User joined room |
| `UserLeft` | `(username)` | User left room |

## ⚠️ Note

This example cannot be compiled or tested on Windows. It is provided for:
- Portfolio demonstration
- Reference implementation
- iOS/macOS developers who want to integrate SmaRTC

## 📄 License

© 2026 Mounir Azizi - DeLTa-X Tunisia - All Rights Reserved

This project is proprietary software. See [LICENSE](../../LICENSE) for details.
