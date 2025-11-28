/**
 * SmaRTC Easy API - Simplified wrapper for quick integration
 * Zero boilerplate, maximum productivity
 */

import { SmaRTCClient } from './client';
import type { ConnectionConfig, ClientEvents } from './types';

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
export class SmaRTCEasy {
  private client: SmaRTCClient;
  private localStream?: MediaStream;
  private config: EasyConfig;
  private callbacks: EasyCallbacks;

  constructor(config: EasyConfig, callbacks: EasyCallbacks = {}) {
    this.config = {
      userName: `User-${Math.random().toString(36).substr(2, 5)}`,
      videoQuality: 'medium',
      audioOnly: false,
      autoJoin: false,
      ...config
    };

    this.callbacks = callbacks;

    // Create underlying client
    const clientConfig: ConnectionConfig = {
      serverUrl: this.config.serverUrl,
      sessionId: this.config.roomId,
      username: this.config.userName!,
      quality: this.config.videoQuality as any, // Type conversion for enum
      enableMesh: true,
      maxDirectPeers: 8
    };

    this.client = new SmaRTCClient(clientConfig);
    this.setupEventHandlers();

    // Auto-join if requested
    if (this.config.autoJoin) {
      this.join().catch(error => {
        console.error('Auto-join failed:', error);
        callbacks.onError?.(error);
      });
    }
  }

  /**
   * Join the room (starts camera/mic and connects)
   */
  async join(): Promise<void> {
    try {
      // Get media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: !this.config.audioOnly ? {
          width: { ideal: this.getVideoWidth() },
          height: { ideal: this.getVideoHeight() }
        } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Connect
      await this.client.connect(this.localStream);
    } catch (error) {
      console.error('Failed to join:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Leave the room (disconnects and stops camera/mic)
   */
  async leave(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = undefined;
    }

    await this.client.disconnect();
  }

  /**
   * Get local media stream
   */
  getLocalStream(): MediaStream | undefined {
    return this.localStream;
  }

  /**
   * Toggle video on/off
   */
  toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false;

    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length === 0) return false;

    const newState = enabled ?? !videoTracks[0].enabled;
    videoTracks.forEach(track => track.enabled = newState);
    return newState;
  }

  /**
   * Toggle audio on/off
   */
  toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false;

    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length === 0) return false;

    const newState = enabled ?? !audioTracks[0].enabled;
    audioTracks.forEach(track => track.enabled = newState);
    return newState;
  }

  /**
   * Change video quality
   */
  setQuality(quality: 'low' | 'medium' | 'high'): void {
    this.config.videoQuality = quality;
    // Note: Quality change requires re-negotiation in real implementation
    console.warn('Quality change will take effect on next session');
  }

  /**
   * Get list of connected peers
   */
  getPeers(): Array<{ id: string; latency: number }> {
    return this.client.getPeers().map(peer => ({
      id: peer.peerId,
      latency: peer.latency
    }));
  }

  /**
   * Get room statistics
   */
  getRoomStats(): {
    totalPeers: number;
    directConnections: number;
    relayedConnections: number;
    meshStrategy?: string;
  } {
    const sessionInfo = this.client.getSessionInfo();
    const peers = this.client.getPeers();

    return {
      totalPeers: peers.length,
      directConnections: peers.filter(p => !p.isRelay).length,
      relayedConnections: peers.filter(p => p.isRelay).length,
      meshStrategy: sessionInfo?.meshStrategy
    };
  }

  /**
   * Send custom message to specific peer
   */
  sendMessageToPeer(peerId: string, message: any): void {
    this.client.sendMessage(peerId, message);
  }

  /**
   * Broadcast message to all peers
   */
  broadcast(message: any): void {
    this.client.broadcast(message);
  }

  /**
   * Listen for custom messages
   */
  onMessage(callback: (peerId: string, message: any) => void): void {
    this.client.on('message', callback);
  }

  // Private methods

  private setupEventHandlers(): void {
    this.client.on('connected', () => {
      this.callbacks.onReady?.();
    });

    this.client.on('peer-joined', (peerId) => {
      this.callbacks.onPeerJoined?.(peerId);
    });

    this.client.on('peer-left', (peerId) => {
      this.callbacks.onPeerLeft?.(peerId);
    });

    this.client.on('remote-stream', (peerId, stream) => {
      this.callbacks.onRemoteStream?.(peerId, stream);
    });

    this.client.on('error', (error) => {
      this.callbacks.onError?.(error);
    });

    this.client.on('disconnected', () => {
      this.callbacks.onDisconnected?.();
    });
  }

  private getVideoWidth(): number {
    switch (this.config.videoQuality) {
      case 'low': return 640;
      case 'medium': return 1280;
      case 'high': return 1920;
      default: return 1280;
    }
  }

  private getVideoHeight(): number {
    switch (this.config.videoQuality) {
      case 'low': return 480;
      case 'medium': return 720;
      case 'high': return 1080;
      default: return 720;
    }
  }
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
export async function quickJoin(
  serverUrl: string,
  roomId: string,
  callbacks: EasyCallbacks = {}
): Promise<SmaRTCEasy> {
  const client = new SmaRTCEasy(
    { serverUrl, roomId, autoJoin: false },
    callbacks
  );

  await client.join();
  return client;
}
