/**
 * Adaptive Mesh Network Client
 * Handles intelligent peer routing and relay management
 */

import { SmaRTCClient } from './client';
import type { ConnectionConfig, PeerConnection, RoutingStrategy } from './types';

export class AdaptiveMeshClient extends SmaRTCClient {
  private routingStrategy: RoutingStrategy = 'fullMesh' as any;
  private relayNodes: Set<string> = new Set();
  private directPeers: Set<string> = new Set();

  constructor(config: ConnectionConfig) {
    super({ ...config, enableMesh: true });
    this.setupMeshHandlers();
  }

  /**
   * Setup mesh-specific event handlers
   */
  private setupMeshHandlers(): void {
    this.on('mesh-update', (topology: any) => {
      this.routingStrategy = topology.strategy;
      this.relayNodes = new Set(topology.relayNodes);
      this.directPeers = new Set(topology.directPeers);

      console.log('🕸️ Mesh updated:', {
        strategy: this.routingStrategy,
        directPeers: this.directPeers.size,
        relayNodes: this.relayNodes.size
      });

      this.optimizeConnections();
    });
  }

  /**
   * Optimize peer connections based on mesh topology
   */
  private async optimizeConnections(): Promise<void> {
    const currentPeers = this.getPeers();

    // Close connections not in direct peers list (if using relay strategy)
    if (this.routingStrategy === 'relayBased') {
      currentPeers.forEach(peer => {
        if (!this.directPeers.has(peer.peerId) && !this.relayNodes.has(peer.peerId)) {
          peer.connection.close();
        }
      });
    }

    // Ensure connections to relay nodes
    this.relayNodes.forEach(async relayId => {
      const existingPeer = currentPeers.find(p => p.peerId === relayId);
      if (!existingPeer) {
        await this.createOffer(relayId);
      }
    });
  }

  /**
   * Get optimal routing path for a message
   */
  getRoutingPath(targetPeerId: string): string[] {
    const peers = this.getPeers();
    const directPeer = peers.find(p => p.peerId === targetPeerId);

    if (directPeer) {
      // Direct connection available
      return [targetPeerId];
    }

    // Route through relay
    const relayPeers = peers.filter(p => this.relayNodes.has(p.peerId));
    if (relayPeers.length > 0) {
      // Choose relay with lowest latency
      const bestRelay = relayPeers.reduce((best, current) =>
        current.latency < best.latency ? current : best
      );
      return [bestRelay.peerId, targetPeerId];
    }

    // No route available (fallback to server)
    return [];
  }

  /**
   * Get current mesh statistics
   */
  getMeshStats() {
    const peers = this.getPeers();
    return {
      strategy: this.routingStrategy,
      totalPeers: peers.length,
      directPeers: Array.from(this.directPeers).length,
      relayNodes: Array.from(this.relayNodes).length,
      averageLatency: peers.reduce((sum, p) => sum + p.latency, 0) / peers.length,
      minLatency: Math.min(...peers.map(p => p.latency)),
      maxLatency: Math.max(...peers.map(p => p.latency))
    };
  }
}
