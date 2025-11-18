# 🍎 SmaRTC Swift SDK

SDK Swift pour intégrer la visioconférence SmaRTC dans vos applications iOS et macOS.

## ⚡ Installation

### Via Swift Package Manager (recommandé)

```swift
// Dans Package.swift
dependencies: [
    .package(url: "https://github.com/DeLTa-X-Tunisia/SmaRTC-Swift.git", from: "1.0.0")
]
```

### Via CocoaPods

```ruby
# Dans Podfile
pod 'SmaRTCSDK', '~> 1.0'
```

### Manuellement

1. Téléchargez le framework depuis [Releases](https://github.com/DeLTa-X-Tunisia/SmaRTC/releases)
2. Glissez-déposez `SmaRTCSDK.framework` dans votre projet

## 🚀 Quick Start (5 minutes)

### 1. Initialiser le SDK

```swift
import SmaRTCSDK

let config = SmaRTCConfig(
    apiUrl: "https://api.votre-domaine.com",
    signalServerUrl: "https://signal.votre-domaine.com/signalhub",
    stunServers: ["stun:stun.l.google.com:19302"]
)

let client = SmaRTCClient(config: config)
```

### 2. Se connecter

```swift
do {
    try await client.auth.login(username: "user@example.com", password: "motdepasse")
    print("✅ Connecté avec succès")
} catch {
    print("❌ Erreur: \(error.localizedDescription)")
}
```

### 3. Créer et rejoindre une session

```swift
// Créer une session
let session = try await client.sessions.create(
    name: "Réunion d'équipe",
    description: "Daily standup"
)

// Rejoindre la session
try await client.webrtc.join(sessionId: session.id) { event in
    switch event {
    case .localStream(let stream):
        // Afficher le flux vidéo local
        self.localVideoView.captureSession = stream
        
    case .remoteStream(let userId, let stream):
        // Afficher le flux vidéo distant
        self.addRemoteVideo(userId: userId, stream: stream)
        
    case .userJoined(let userId):
        print("👋 \(userId) a rejoint")
        
    case .userLeft(let userId):
        print("👋 \(userId) est parti")
        
    case .error(let error):
        print("❌ Erreur: \(error)")
    }
}
```

## 📱 Exemple complet (SwiftUI)

```swift
import SwiftUI
import SmaRTCSDK

struct ContentView: View {
    @StateObject private var viewModel = VideoCallViewModel()
    
    var body: some View {
        ZStack {
            // Gradient background
            LinearGradient(
                colors: [.blue, .purple],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            if viewModel.isInCall {
                CallView(viewModel: viewModel)
            } else {
                LoginView(viewModel: viewModel)
            }
        }
    }
}

struct LoginView: View {
    @ObservedObject var viewModel: VideoCallViewModel
    @State private var username = "demo"
    @State private var password = "Demo123!"
    
    var body: some View {
        VStack(spacing: 20) {
            Text("SmaRTC")
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            VStack(spacing: 15) {
                TextField("Username", text: $username)
                    .textFieldStyle(.roundedBorder)
                
                SecureField("Password", text: $password)
                    .textFieldStyle(.roundedBorder)
            }
            .padding(.horizontal, 40)
            
            Button {
                Task {
                    await viewModel.login(username: username, password: password)
                }
            } label: {
                Text("Démarrer une session")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.white)
                    .foregroundColor(.blue)
                    .cornerRadius(12)
            }
            .padding(.horizontal, 40)
        }
    }
}

struct CallView: View {
    @ObservedObject var viewModel: VideoCallViewModel
    
    var body: some View {
        VStack {
            // Vidéo locale
            if let localStream = viewModel.localStream {
                VideoView(stream: localStream)
                    .frame(height: 200)
                    .cornerRadius(12)
                    .overlay(
                        Text("Vous")
                            .padding(8)
                            .background(Color.black.opacity(0.7))
                            .foregroundColor(.white)
                            .cornerRadius(8)
                            .padding(8),
                        alignment: .topLeading
                    )
            }
            
            // Vidéos distantes
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 150))]) {
                ForEach(Array(viewModel.remoteStreams.keys), id: \.self) { userId in
                    if let stream = viewModel.remoteStreams[userId] {
                        VideoView(stream: stream)
                            .frame(height: 150)
                            .cornerRadius(12)
                            .overlay(
                                Text("User \(userId)")
                                    .font(.caption)
                                    .padding(4)
                                    .background(Color.black.opacity(0.7))
                                    .foregroundColor(.white)
                                    .cornerRadius(4)
                                    .padding(4),
                                alignment: .topLeading
                            )
                    }
                }
            }
            
            Spacer()
            
            // Contrôles
            HStack(spacing: 30) {
                Button {
                    Task {
                        await viewModel.toggleMute()
                    }
                } label: {
                    Image(systemName: viewModel.isMuted ? "mic.slash.fill" : "mic.fill")
                        .font(.title2)
                        .frame(width: 60, height: 60)
                        .background(Color.white)
                        .foregroundColor(.blue)
                        .clipShape(Circle())
                }
                
                Button {
                    Task {
                        await viewModel.toggleCamera()
                    }
                } label: {
                    Image(systemName: viewModel.isCameraOff ? "video.slash.fill" : "video.fill")
                        .font(.title2)
                        .frame(width: 60, height: 60)
                        .background(Color.white)
                        .foregroundColor(.blue)
                        .clipShape(Circle())
                }
                
                Button {
                    Task {
                        await viewModel.leave()
                    }
                } label: {
                    Image(systemName: "phone.down.fill")
                        .font(.title2)
                        .frame(width: 60, height: 60)
                        .background(Color.red)
                        .foregroundColor(.white)
                        .clipShape(Circle())
                }
            }
            .padding()
        }
        .padding()
    }
}

// ViewModel
@MainActor
class VideoCallViewModel: ObservableObject {
    @Published var isInCall = false
    @Published var localStream: MediaStream?
    @Published var remoteStreams: [String: MediaStream] = [:]
    @Published var isMuted = false
    @Published var isCameraOff = false
    
    private var client: SmaRTCClient?
    
    func login(username: String, password: String) async {
        do {
            let config = SmaRTCConfig(
                apiUrl: "http://localhost:8080",
                signalServerUrl: "http://localhost:5001/signalhub"
            )
            client = SmaRTCClient(config: config)
            
            try await client?.auth.login(username: username, password: password)
            
            let session = try await client?.sessions.create(
                name: "SwiftUI Session",
                description: "Test depuis SwiftUI"
            )
            
            try await client?.webrtc.join(sessionId: session!.id) { [weak self] event in
                DispatchQueue.main.async {
                    self?.handleWebRTCEvent(event)
                }
            }
            
            isInCall = true
        } catch {
            print("❌ Erreur: \(error)")
        }
    }
    
    func handleWebRTCEvent(_ event: WebRTCEvent) {
        switch event {
        case .localStream(let stream):
            localStream = stream
        case .remoteStream(let userId, let stream):
            remoteStreams[userId] = stream
        case .userLeft(let userId):
            remoteStreams.removeValue(forKey: userId)
        default:
            break
        }
    }
    
    func toggleMute() async {
        await client?.webrtc.toggleMute()
        isMuted.toggle()
    }
    
    func toggleCamera() async {
        await client?.webrtc.toggleCamera()
        isCameraOff.toggle()
    }
    
    func leave() async {
        await client?.webrtc.leave()
        await client?.auth.logout()
        isInCall = false
        localStream = nil
        remoteStreams.removeAll()
    }
}
```

## 🎥 Exemple UIKit

```swift
import UIKit
import SmaRTCSDK

class VideoCallViewController: UIViewController {
    private var client: SmaRTCClient!
    private var localVideoView: UIView!
    private var remoteVideosStackView: UIStackView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupClient()
    }
    
    private func setupClient() {
        let config = SmaRTCConfig(
            apiUrl: "http://localhost:8080",
            signalServerUrl: "http://localhost:5001/signalhub",
            debug: true
        )
        client = SmaRTCClient(config: config)
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        // Local video view
        localVideoView = UIView()
        localVideoView.backgroundColor = .black
        localVideoView.layer.cornerRadius = 12
        view.addSubview(localVideoView)
        
        // Remote videos stack
        remoteVideosStackView = UIStackView()
        remoteVideosStackView.axis = .vertical
        remoteVideosStackView.spacing = 10
        view.addSubview(remoteVideosStackView)
        
        // Layout...
    }
    
    @objc private func loginTapped() {
        Task {
            do {
                try await client.auth.login(
                    username: "demo",
                    password: "Demo123!"
                )
                
                let session = try await client.sessions.create(
                    name: "UIKit Session"
                )
                
                try await client.webrtc.join(sessionId: session.id) { [weak self] event in
                    DispatchQueue.main.async {
                        self?.handleWebRTCEvent(event)
                    }
                }
            } catch {
                showError(error)
            }
        }
    }
    
    private func handleWebRTCEvent(_ event: WebRTCEvent) {
        switch event {
        case .localStream(let stream):
            displayLocalVideo(stream)
        case .remoteStream(let userId, let stream):
            addRemoteVideo(userId: userId, stream: stream)
        case .userLeft(let userId):
            removeRemoteVideo(userId: userId)
        case .error(let error):
            showError(error)
        default:
            break
        }
    }
    
    @objc private func muteTapped() {
        Task {
            await client.webrtc.toggleMute()
        }
    }
    
    @objc private func cameraTapped() {
        Task {
            await client.webrtc.toggleCamera()
        }
    }
    
    @objc private func leaveTapped() {
        Task {
            await client.webrtc.leave()
            await client.auth.logout()
            dismiss(animated: true)
        }
    }
}
```

## 📦 API Reference

### Client

```swift
let client = SmaRTCClient(config: config)
```

**Config:**
```swift
struct SmaRTCConfig {
    let apiUrl: String
    let signalServerUrl: String
    let stunServers: [String]
    let turnServers: [TurnServer]?
    let autoReconnect: Bool
    let debug: Bool
}
```

### Auth

```swift
// Login
try await client.auth.login(username: "user", password: "pass")

// Register
try await client.auth.register(username: "user", password: "pass", role: "User")

// Logout
await client.auth.logout()

// Check if authenticated
let isAuth = client.auth.isAuthenticated

// Get current user
let user = client.auth.currentUser
```

### Sessions

```swift
// Get all sessions
let sessions = try await client.sessions.getAll()

// Get session by ID
let session = try await client.sessions.getById(sessionId)

// Create session
let session = try await client.sessions.create(
    name: "Session name",
    description: "Optional description"
)

// Delete session
try await client.sessions.delete(sessionId)
```

### WebRTC

```swift
// Join session
try await client.webrtc.join(sessionId: sessionId) { event in
    switch event {
    case .localStream(let stream):
        // Handle local stream
    case .remoteStream(let userId, let stream):
        // Handle remote stream
    case .userJoined(let userId):
        // Handle user joined
    case .userLeft(let userId):
        // Handle user left
    case .error(let error):
        // Handle error
    }
}

// Leave session
await client.webrtc.leave()

// Toggle microphone
await client.webrtc.toggleMute()

// Toggle camera
await client.webrtc.toggleCamera()

// Switch camera
await client.webrtc.switchCamera()

// Get stats
let stats = try await client.webrtc.getStats()
```

## 🔧 Permissions (Info.plist)

```xml
<key>NSCameraUsageDescription</key>
<string>Cette app a besoin d'accéder à votre caméra pour les appels vidéo</string>

<key>NSMicrophoneUsageDescription</key>
<string>Cette app a besoin d'accéder à votre micro pour les appels audio</string>
```

## 🐛 Troubleshooting

### Problème de permissions

```swift
import AVFoundation

func checkPermissions() async -> Bool {
    let cameraStatus = AVCaptureDevice.authorizationStatus(for: .video)
    let micStatus = AVCaptureDevice.authorizationStatus(for: .audio)
    
    if cameraStatus != .authorized {
        let granted = await AVCaptureDevice.requestAccess(for: .video)
        if !granted { return false }
    }
    
    if micStatus != .authorized {
        let granted = await AVCaptureDevice.requestAccess(for: .audio)
        if !granted { return false }
    }
    
    return true
}
```

### Background mode

Activez "Audio, AirPlay, and Picture in Picture" dans Signing & Capabilities.

## 📚 Ressources

- [Documentation complète](https://docs.smartc.tn)
- [Exemples](./examples/)
- [API Reference](https://docs.smartc.tn/api/swift)
- [GitHub](https://github.com/DeLTa-X-Tunisia/SmaRTC)

## 📄 Licence

MIT License - voir [LICENSE](../../LICENSE)

---

**Made with ❤️ by DeLTa-X Tunisia**
