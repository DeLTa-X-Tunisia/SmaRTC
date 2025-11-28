/**
 * SmaRTC Easy API - Simplified wrapper for quick integration
 * Zero boilerplate, maximum productivity
 */
export interface EasyConfig {
    serverUrl: string;
    roomId: string;
    userName?: string;
    videoQuality?: 'low' | 'medium' | 'high';
    audioOnly?: boolean;
    autoJoin?: boolean;
}
export interface EasyCallbacks {
    onReady?: () => void;
    onPeerJoined?: (peerId: string) => void;
    onPeerLeft?: (peerId: string) => void;
    onRemoteStream?: (peerId: string, stream: MediaStream) => void;
    onError?: (error: Error) => void;
    onDisconnected?: () => void;
}
/**
 * Easy API - Simplified SmaRTC client
 * Perfect for quick prototypes and simple use cases
 */
export declare class SmaRTCEasy {
    private client;
    private localStream?;
    private config;
    private callbacks;
    constructor(config: EasyConfig, callbacks?: EasyCallbacks);
    /**
     * Join the room (starts camera/mic and connects)
     */
    join(): Promise<void>;
    /**
     * Leave the room (disconnects and stops camera/mic)
     */
    leave(): Promise<void>;
    /**
     * Get local media stream
     */
    getLocalStream(): MediaStream | undefined;
    /**
     * Toggle video on/off
     */
    toggleVideo(enabled?: boolean): boolean;
    /**
     * Toggle audio on/off
     */
    toggleAudio(enabled?: boolean): boolean;
    /**
     * Change video quality
     */
    setQuality(quality: 'low' | 'medium' | 'high'): void;
    /**
     * Get list of connected peers
     */
    getPeers(): Array<{
        id: string;
        latency: number;
    }>;
    /**
     * Get room statistics
     */
    getRoomStats(): {
        totalPeers: number;
        directConnections: number;
        relayedConnections: number;
        meshStrategy?: string;
    };
    /**
     * Send custom message to specific peer
     */
    sendMessageToPeer(peerId: string, message: any): void;
    /**
     * Broadcast message to all peers
     */
    broadcast(message: any): void;
    /**
     * Listen for custom messages
     */
    onMessage(callback: (peerId: string, message: any) => void): void;
    private setupEventHandlers;
    private getVideoWidth;
    private getVideoHeight;
}
/**
 * Quick helper function for ultra-simple integration
 *
 * @example
 * const room = await quickJoin('http://localhost:5000', 'my-room', {
 *   onRemoteStream: (peerId, stream) => {
 *     // Display remote video
 *   }
 * });
 */
export declare function quickJoin(serverUrl: string, roomId: string, callbacks?: EasyCallbacks): Promise<SmaRTCEasy>;
//# sourceMappingURL=easy.d.ts.map