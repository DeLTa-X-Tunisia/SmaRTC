// 🍎 SmaRTC Swift SDK Simplifié
// Wrapper moderne pour iOS et macOS
import Foundation

/// Configuration du client SmaRTC
public struct SmaRTCConfig {
    public var apiBaseUrl: String
    public var signalServerUrl: String
    public var timeout: TimeInterval
    public var enableLogs: Bool
    
    public init(
        apiBaseUrl: String = "http://localhost:8080",
        signalServerUrl: String = "http://localhost:5001",
        timeout: TimeInterval = 10,
        enableLogs: Bool = false
    ) {
        self.apiBaseUrl = apiBaseUrl
        self.signalServerUrl = signalServerUrl
        self.timeout = timeout
        self.enableLogs = enableLogs
    }
}

// MARK: - Types de données

public struct User: Codable {
    public let id: String
    public let username: String
}

public struct Session: Codable {
    public let sessionId: String
    public let roomName: String
    public let hostUserId: String
    public let participants: [String]
    public let createdAt: String
    public let isActive: Bool
}

public struct ICEServer: Codable {
    public let urls: [String]
    public let username: String?
    public let credential: String?
}

private struct LoginRequest: Codable {
    let username: String
    let password: String
}

private struct LoginResponse: Codable {
    let token: String
    let user: User
}

private struct CreateSessionRequest: Codable {
    let roomName: String
}

private struct JoinSessionRequest: Codable {
    let sessionId: String
}

// MARK: - Erreurs

public enum SmaRTCError: Error, LocalizedError {
    case authentication
    case sessionNotFound
    case network(String)
    case generic(String)
    
    public var errorDescription: String? {
        switch self {
        case .authentication:
            return "Identifiants incorrects"
        case .sessionNotFound:
            return "Cet appel n'existe pas"
        case .network(let message):
            return "Problème de connexion : \(message)"
        case .generic(let message):
            return message
        }
    }
}

// MARK: - Client SmaRTC

@available(iOS 13.0, macOS 10.15, *)
public class SmaRTCSimple {
    
    private let config: SmaRTCConfig
    private let session: URLSession
    private var token: String?
    private var currentUsername: String?
    private var currentSessionId: String?
    
    public var isLoggedIn: Bool {
        return token != nil
    }
    
    public var username: String? {
        return currentUsername
    }
    
    public var sessionId: String? {
        return currentSessionId
    }
    
    public init(config: SmaRTCConfig = SmaRTCConfig()) {
        self.config = config
        
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = config.timeout
        self.session = URLSession(configuration: configuration)
    }
    
    // MARK: - Méthodes privées
    
    private func request<T: Decodable>(
        method: String,
        path: String,
        body: Encodable? = nil,
        requireAuth: Bool = false
    ) async throws -> T {
        guard let url = URL(string: "\(config.apiBaseUrl)\(path)") else {
            throw SmaRTCError.generic("URL invalide")
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if requireAuth, let token = token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            let encoder = JSONEncoder()
            request.httpBody = try encoder.encode(body)
        }
        
        if config.enableLogs {
            print("[SmaRTC] \(method) \(url)")
        }
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw SmaRTCError.network("Réponse invalide")
            }
            
            if httpResponse.statusCode >= 400 {
                switch httpResponse.statusCode {
                case 401:
                    throw SmaRTCError.authentication
                case 404:
                    throw SmaRTCError.sessionNotFound
                default:
                    let errorMessage = String(data: data, encoding: .utf8) ?? "Erreur inconnue"
                    throw SmaRTCError.generic("Erreur HTTP \(httpResponse.statusCode) : \(errorMessage)")
                }
            }
            
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: data)
            
        } catch let error as SmaRTCError {
            throw error
        } catch {
            throw SmaRTCError.network(error.localizedDescription)
        }
    }
    
    // MARK: - Méthodes publiques
    
    /// Authentifie l'utilisateur
    public func login(username: String, password: String) async throws {
        let request = LoginRequest(username: username, password: password)
        let response: LoginResponse = try await self.request(
            method: "POST",
            path: "/api/auth/login",
            body: request
        )
        
        self.token = response.token
        self.currentUsername = response.user.username
        
        if config.enableLogs {
            print("[SmaRTC] Connecté en tant que \(response.user.username)")
        }
    }
    
    /// Crée un nouveau compte utilisateur
    public func register(username: String, password: String) async throws -> User {
        let request = LoginRequest(username: username, password: password)
        return try await self.request(
            method: "POST",
            path: "/api/auth/register",
            body: request
        )
    }
    
    /// Crée un nouvel appel
    public func startCall(roomName: String) async throws -> Session {
        let request = CreateSessionRequest(roomName: roomName)
        let session: Session = try await self.request(
            method: "POST",
            path: "/api/session",
            body: request,
            requireAuth: true
        )
        
        self.currentSessionId = session.sessionId
        
        if config.enableLogs {
            print("[SmaRTC] Appel créé : \(session.sessionId)")
        }
        
        return session
    }
    
    /// Rejoint un appel existant
    public func joinCall(sessionId: String) async throws -> Session {
        let request = JoinSessionRequest(sessionId: sessionId)
        let session: Session = try await self.request(
            method: "POST",
            path: "/api/session/join",
            body: request,
            requireAuth: true
        )
        
        self.currentSessionId = session.sessionId
        
        if config.enableLogs {
            print("[SmaRTC] Appel rejoint : \(session.sessionId)")
        }
        
        return session
    }
    
    /// Termine l'appel en cours
    public func endCall() async throws {
        guard let sessionId = currentSessionId else {
            throw SmaRTCError.generic("Aucun appel en cours")
        }
        
        struct EmptyResponse: Codable {}
        let _: EmptyResponse = try await request(
            method: "DELETE",
            path: "/api/session/\(sessionId)",
            requireAuth: true
        )
        
        if config.enableLogs {
            print("[SmaRTC] Appel terminé : \(sessionId)")
        }
        
        self.currentSessionId = nil
    }
    
    /// Liste tous les appels actifs
    public func getAvailableCalls() async throws -> [Session] {
        return try await request(
            method: "GET",
            path: "/api/session",
            requireAuth: true
        )
    }
    
    /// Récupère la configuration STUN/TURN
    public func getICEServers() async throws -> [ICEServer] {
        do {
            return try await request(
                method: "GET",
                path: "/api/webrtc/ice",
                requireAuth: true
            )
        } catch {
            // Fallback vers Google STUN
            return [
                ICEServer(
                    urls: ["stun:stun.l.google.com:19302"],
                    username: nil,
                    credential: nil
                )
            ]
        }
    }
    
    /// Déconnecte l'utilisateur
    public func logout() async {
        // Terminer l'appel en cours si existant
        if currentSessionId != nil {
            do {
                try await endCall()
            } catch {
                if config.enableLogs {
                    print("[SmaRTC] Erreur lors de la fin d'appel : \(error)")
                }
            }
        }
        
        self.token = nil
        self.currentUsername = nil
        self.currentSessionId = nil
        
        if config.enableLogs {
            print("[SmaRTC] Déconnecté")
        }
    }
}
