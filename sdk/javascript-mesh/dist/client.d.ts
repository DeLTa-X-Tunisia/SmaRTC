/**
 * SmaRTC Client - Main WebRTC Client with Mesh Support
 * Handles connection, signaling, and peer management
 */
import type { ConnectionConfig, ClientEvents, PeerConnection, SessionInfo } from './types';
export declare class SmaRTCClient {
    private connection;
    private config;
    private peers;
    private localStream?;
    private eventHandlers;
    private sessionInfo?;
    private latencyMap;
    private usernameMap;
    constructor(config: ConnectionConfig);
    /**
     * Connect to SmaRTC server and join session
     */
    connect(localStream?: MediaStream): Promise<void>;
    /**
     * Disconnect from server and close all peer connections
     */
    disconnect(): Promise<void>;
    /**
     * Create peer connection for direct communication
     */
    createPeerConnection(peerId: string): Promise<RTCPeerConnection>;
    /**
     * Create and send WebRTC offer
     */
    createOffer(peerId: string): Promise<void>;
    /**
     * Handle incoming WebRTC offer
     */
    handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<void>;
    /**
     * Handle incoming WebRTC answer
     */
    handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void>;
    /**
     * Handle incoming ICE candidate
     */
    handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void>;
    /**
     * Send signal through SignalR (fallback) or DataChannel (preferred)
     */
    private sendSignal;
    /**
     * Setup SignalR event handlers
     */
    private setupSignalRHandlers;
    /**
     * Setup data channel for P2P signaling
     */
    private setupDataChannel;
    /**
     * Handle P2P signal received via data channel
     */
    private handleP2PSignal;
    /**
     * Measure latency to peer
     */
    private measureLatency;
    /**
     * Start heartbeat to keep connection alive
     */
    private startHeartbeat;
    /**
     * Get session information
     */
    getSessionInfo(): SessionInfo | undefined;
    /**
     * Get connected peers
     */
    getPeers(): PeerConnection[];
    /**
     * Send custom message to specific peer via data channel
     */
    sendMessage(peerId: string, data: any): void;
    /**
     * Broadcast message to all connected peers
     */
    broadcast(data: any): void;
    /**
     * Get WebRTC stats for a specific peer
     */
    getStats(peerId?: string): Promise<any>;
    /**
     * Change video quality dynamically
     */
    setQuality(quality: string): void;
    /**
     * Event emitter helpers
     */
    on<K extends keyof ClientEvents>(event: K, handler: ClientEvents[K]): void;
    off<K extends keyof ClientEvents>(event: K, handler: ClientEvents[K]): void;
    private emit;
}
//# sourceMappingURL=client.d.ts.map