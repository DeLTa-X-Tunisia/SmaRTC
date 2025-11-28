/**
 * Type definitions for SmaRTC Zero-Cost SDK
 */
export interface ConnectionConfig {
    serverUrl: string;
    sessionId: string;
    username: string;
    enableMesh?: boolean;
    canRelay?: boolean;
    maxDirectPeers?: number;
    iceServers?: RTCIceServer[];
    codec?: 'vp8' | 'vp9' | 'h264';
    quality?: QualityLevel;
}
export declare enum QualityLevel {
    VeryLow = "veryLow",// 144p, ~50kbps
    Low = "low",// 240p, ~100kbps
    Medium = "medium",// 360p, ~200kbps
    High = "high",// 480p, ~400kbps
    VeryHigh = "veryHigh"
}
export declare enum RoutingStrategy {
    FullMesh = "fullMesh",
    Hybrid = "hybrid",
    RelayBased = "relayBased"
}
export interface PeerConnection {
    peerId: string;
    connection: RTCPeerConnection;
    dataChannel?: RTCDataChannel;
    latency: number;
    isRelay: boolean;
}
export interface SessionInfo {
    sessionId: string;
    participantCount: number;
    totalPeers: number;
    routingStrategy: RoutingStrategy;
    meshStrategy?: string;
    relayNodeCount: number;
    isRelayNode: boolean;
}
export interface SignalMessage {
    type: 'offer' | 'answer' | 'ice-candidate' | 'relay';
    from: string;
    to: string;
    data: any;
}
export interface MeshTopologyUpdate {
    directPeers: string[];
    relayNodes: string[];
    strategy: RoutingStrategy;
}
export interface MediaStats {
    bandwidth: number;
    packetsLost: number;
    jitter: number;
    roundTripTime: number;
}
export interface ClientEvents {
    'connected': () => void;
    'disconnected': () => void;
    'peer-joined': (peerId: string) => void;
    'peer-left': (peerId: string) => void;
    'remote-stream': (peerId: string, stream: MediaStream) => void;
    'mesh-update': (topology: MeshTopologyUpdate) => void;
    'quality-changed': (quality: QualityLevel) => void;
    'relay-promotion': (isRelay: boolean) => void;
    'stats': (stats: MediaStats) => void;
    'error': (error: Error) => void;
    'message': (peerId: string, data: any) => void;
    'session-info': (info: SessionInfo) => void;
}
//# sourceMappingURL=types.d.ts.map