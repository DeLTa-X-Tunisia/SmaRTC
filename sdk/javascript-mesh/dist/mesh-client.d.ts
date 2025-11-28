/**
 * Adaptive Mesh Network Client
 * Handles intelligent peer routing and relay management
 */
import { SmaRTCClient } from './client';
import type { ConnectionConfig, RoutingStrategy } from './types';
export declare class AdaptiveMeshClient extends SmaRTCClient {
    private routingStrategy;
    private relayNodes;
    private directPeers;
    constructor(config: ConnectionConfig);
    /**
     * Setup mesh-specific event handlers
     */
    private setupMeshHandlers;
    /**
     * Optimize peer connections based on mesh topology
     */
    private optimizeConnections;
    /**
     * Get optimal routing path for a message
     */
    getRoutingPath(targetPeerId: string): string[];
    /**
     * Get current mesh statistics
     */
    getMeshStats(): {
        strategy: RoutingStrategy;
        totalPeers: number;
        directPeers: number;
        relayNodes: number;
        averageLatency: number;
        minLatency: number;
        maxLatency: number;
    };
}
//# sourceMappingURL=mesh-client.d.ts.map