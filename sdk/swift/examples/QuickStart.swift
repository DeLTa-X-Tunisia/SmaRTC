import SwiftUI
import SmaRTCSDK

@main
struct QuickStartApp: App {
    init() {
        // Configure SDK
        let config = SmaRTCConfig(
            apiUrl: "http://localhost:8080",
            signalServerUrl: "http://localhost:5001/signalhub"
        )
        SmaRTCClient.configure(config: config)
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    @State private var username = "demo"
    @State private var password = "Demo123!"
    @State private var sessionId: String?
    
    var body: some View {
        if let sessionId = sessionId {
            CallScreen(sessionId: sessionId)
        } else {
            loginScreen
        }
    }
    
    var loginScreen: some View {
        VStack(spacing: 20) {
            TextField("Username", text: $username)
            SecureField("Password", text: $password)
            
            Button("Démarrer") {
                Task {
                    do {
                        // Login
                        try await SmaRTCClient.shared.auth.login(
                            username: username,
                            password: password
                        )
                        
                        // Create session
                        let session = try await SmaRTCClient.shared.sessions.create(
                            name: "Quick Start Session"
                        )
                        
                        sessionId = session.id
                    } catch {
                        print("Error: \(error)")
                    }
                }
            }
        }
        .padding()
    }
}
