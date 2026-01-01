// SmaRTC Swift SDK Client
// © 2026 Mounir Azizi - DeLTa-X Tunisia - All Rights Reserved
// This project is for demonstration purposes only.

import Foundation
import SignalRClient

/// Callback types for SignalR events
public typealias MessageCallback = (_ user: String, _ message: String) -> Void
public typealias UserCallback = (_ username: String) -> Void
public typealias VoidCallback = () -> Void
public typealias ErrorCallback = (_ error: Error) -> Void

/// SmaRTC SignalR Client for Swift
/// Provides real-time communication capabilities for iOS/macOS applications
public class SmaRTCClient {
    
    // MARK: - Properties
    
    private let hubUrl: String
    private var hubConnection: HubConnection?
    private var username: String = ""
    private var roomName: String = ""
    private var isConnectedFlag: Bool = false
    
    // MARK: - Callbacks
    
    /// Called when a signal/message is received from another user
    public var onSignalReceived: MessageCallback?
    
    /// Called when a new user joins the room
    public var onUserJoined: UserCallback?
    
    /// Called when a user leaves the room
    public var onUserLeft: UserCallback?
    
    /// Called when successfully connected to the hub
    public var onConnected: VoidCallback?
    
    /// Called when disconnected from the hub
    public var onDisconnected: VoidCallback?
    
    /// Called when an error occurs
    public var onError: ErrorCallback?
    
    // MARK: - Initialization
    
    /// Initialize the SmaRTC client with the SignalR hub URL
    /// - Parameter hubUrl: The URL of the SignalR hub (e.g., "http://localhost:5001/signalhub")
    public init(hubUrl: String) {
        self.hubUrl = hubUrl
    }
    
    // MARK: - Connection Management
    
    /// Connect to the SignalR hub
    /// - Returns: True if connection was initiated successfully
    @discardableResult
    public func connect() -> Bool {
        guard hubConnection == nil else {
            print("⚠️ Already connected or connecting")
            return false
        }
        
        // Build the hub connection
        hubConnection = HubConnectionBuilder(url: URL(string: hubUrl)!)
            .withLogging(minLogLevel: .warning)
            .withAutoReconnect()
            .build()
        
        // Set up event handlers
        setupEventHandlers()
        
        // Set up connection lifecycle handlers
        hubConnection?.delegate = self
        
        // Start the connection
        hubConnection?.start()
        
        return true
    }
    
    /// Disconnect from the SignalR hub
    public func disconnect() {
        leaveRoom()
        hubConnection?.stop()
        hubConnection = nil
        isConnectedFlag = false
    }
    
    /// Check if currently connected to the hub
    public var isConnected: Bool {
        return isConnectedFlag && hubConnection?.state == .connected
    }
    
    // MARK: - Room Management
    
    /// Join a chat room
    /// - Parameters:
    ///   - room: The name of the room to join
    ///   - user: The username to use in the room
    public func joinRoom(room: String, user: String) {
        self.roomName = room
        self.username = user
        
        hubConnection?.invoke(method: "JoinSession", roomName, username) { error in
            if let error = error {
                self.onError?(error)
            }
        }
    }
    
    /// Leave the current room
    public func leaveRoom() {
        guard !roomName.isEmpty && !username.isEmpty else { return }
        
        hubConnection?.invoke(method: "LeaveSession", roomName, username) { error in
            if let error = error {
                self.onError?(error)
            }
        }
    }
    
    // MARK: - Messaging
    
    /// Send a message to the current room
    /// - Parameter message: The message content to send
    public func sendMessage(_ message: String) {
        guard isConnected else {
            print("⚠️ Not connected to hub")
            return
        }
        
        hubConnection?.invoke(method: "SendSignalToSession", roomName, message, username) { error in
            if let error = error {
                self.onError?(error)
            }
        }
    }
    
    // MARK: - Accessors
    
    /// Get the current username
    public func getUsername() -> String {
        return username
    }
    
    /// Get the current room name
    public func getRoomName() -> String {
        return roomName
    }
    
    // MARK: - Private Methods
    
    private func setupEventHandlers() {
        // Handle incoming signals/messages
        hubConnection?.on(method: "SendSignal") { [weak self] (user: String, message: String) in
            guard let self = self else { return }
            // Don't echo our own messages
            let cleanUser = user.trimmingCharacters(in: CharacterSet(charactersIn: "\""))
            let cleanMessage = message.trimmingCharacters(in: CharacterSet(charactersIn: "\""))
            if cleanUser != self.username {
                self.onSignalReceived?(cleanUser, cleanMessage)
            }
        }
        
        // Handle new user arrivals
        hubConnection?.on(method: "NewUserArrived") { [weak self] (user: String) in
            let cleanUser = user.trimmingCharacters(in: CharacterSet(charactersIn: "\""))
            self?.onUserJoined?(cleanUser)
        }
        
        // Handle user departures
        hubConnection?.on(method: "UserLeft") { [weak self] (user: String) in
            let cleanUser = user.trimmingCharacters(in: CharacterSet(charactersIn: "\""))
            self?.onUserLeft?(cleanUser)
        }
    }
}

// MARK: - HubConnectionDelegate

extension SmaRTCClient: HubConnectionDelegate {
    
    public func connectionDidOpen(hubConnection: HubConnection) {
        isConnectedFlag = true
        onConnected?()
    }
    
    public func connectionDidClose(error: Error?) {
        isConnectedFlag = false
        if let error = error {
            onError?(error)
        }
        onDisconnected?()
    }
    
    public func connectionDidFailToOpen(error: Error) {
        isConnectedFlag = false
        onError?(error)
    }
    
    public func connectionWillReconnect(error: Error) {
        print("🔄 Reconnecting...")
    }
    
    public func connectionDidReconnect() {
        isConnectedFlag = true
        print("✅ Reconnected!")
        // Re-join the room after reconnection
        if !roomName.isEmpty && !username.isEmpty {
            joinRoom(room: roomName, user: username)
        }
    }
}
