/**
 * SmaRTC Client - Main WebRTC Client with Mesh Support
 * Handles connection, signaling, and peer management
 */

import * as signalR from '@microsoft/signalr';
import { encode, decode } from '@msgpack/msgpack';
import type {
  ConnectionConfig,
  ClientEvents,
  PeerConnection,
  SessionInfo,
  SignalMessage,
  QualityLevel
} from './types';

export class SmaRTCClient {
  private connection: signalR.HubConnection;
  private config: ConnectionConfig;
  private peers: Map<string, PeerConnection> = new Map();
  private localStream?: MediaStream;
  private eventHandlers: Map<keyof ClientEvents, Function[]> = new Map();
  private sessionInfo?: SessionInfo;
  private latencyMap: Map<string, number> = new Map();
  private usernameMap: Map<string, string> = new Map();

  constructor(config: ConnectionConfig) {
    this.config = {
      maxDirectPeers: 8,
      enableMesh: true,
      canRelay: false,
      quality: 'medium' as any,
      ...config
    };

    // Initialize SignalR connection with MessagePack protocol
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${config.serverUrl}/signalhub`)
      .withHubProtocol(new signalR.JsonHubProtocol()) // MessagePack would be: .withHubProtocol(new signalR.MessagePackHubProtocol())
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: () => 2000 // 2s retry
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.setupSignalRHandlers();
  }

  /**
   * Connect to SmaRTC server and join session
   */
  async connect(localStream?: MediaStream): Promise<void> {
    this.localStream = localStream;

    try {
      await this.connection.start();
      console.log('✅ Connected to SmaRTC server');

      // Join session
      await this.connection.invoke(
        'JoinSession',
        this.config.sessionId,
        this.config.username
      );

      // Set relay capability if enabled
      if (this.config.canRelay) {
        await this.connection.invoke('SetRelayCapability', true);
      }

      this.emit('connected');
      this.startHeartbeat();
    } catch (error) {
      console.error('❌ Connection failed:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from server and close all peer connections
   */
  async disconnect(): Promise<void> {
    // Leave session
    if (this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('LeaveSession', this.config.sessionId);
    }

    // Close all peer connections
    this.peers.forEach(peer => {
      peer.connection.close();
    });
    this.peers.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // Disconnect SignalR
    await this.connection.stop();

    this.emit('disconnected');
  }

  /**
   * Create peer connection for direct communication
   */
  async createPeerConnection(peerId: string): Promise<RTCPeerConnection> {
    const config: RTCConfiguration = {
      iceServers: this.config.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(config);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      const username = this.usernameMap.get(peerId) || 'Unknown User';
      console.log('📹 Received remote stream from:', username);
      this.emit('remote-stream', peerId, event.streams[0], username);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(peerId, {
          type: 'ice-candidate',
          from: this.config.username,
          to: peerId,
          data: event.candidate
        });
      }
    };

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log(`Peer ${peerId} connection state:`, pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        this.measureLatency(peerId);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.peers.delete(peerId);
      }
    };

    // Create data channel for signaling
    const dataChannel = pc.createDataChannel('smartc-signals', {
      ordered: true,
      maxRetransmits: 3
    });

    this.setupDataChannel(peerId, dataChannel);

    // Store peer connection
    this.peers.set(peerId, {
      peerId,
      connection: pc,
      dataChannel,
      latency: 999,
      isRelay: false
    });

    return pc;
  }

  /**
   * Create and send WebRTC offer
   */
  async createOffer(peerId: string): Promise<void> {
    const pc = await this.createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.sendSignal(peerId, {
      type: 'offer',
      from: this.config.username,
      to: peerId,
      data: offer
    });
  }

  /**
   * Handle incoming WebRTC offer
   */
  async handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const pc = await this.createPeerConnection(peerId);
    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.sendSignal(peerId, {
      type: 'answer',
      from: this.config.username,
      to: peerId,
      data: answer
    });
  }

  /**
   * Handle incoming WebRTC answer
   */
  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      // Only set remote description if we're in the correct state
      if (peer.connection.signalingState === 'have-local-offer') {
        await peer.connection.setRemoteDescription(answer);
        console.log('✅ Answer set for peer:', peerId);
      } else {
        console.warn('⚠️ Ignoring answer in wrong state:', peer.connection.signalingState);
      }
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      await peer.connection.addIceCandidate(candidate);
    }
  }

  /**
   * Send signal through SignalR (fallback) or DataChannel (preferred)
   */
  private async sendSignal(targetPeerId: string, signal: SignalMessage): Promise<void> {
    const peer = this.peers.get(targetPeerId);

    // Try to send via DataChannel first (zero server cost!)
    if (peer?.dataChannel?.readyState === 'open') {
      const encoded = encode(signal) as Uint8Array;
      peer.dataChannel.send(encoded as any);
      return;
    }

    // Fallback to SignalR
    await this.connection.invoke(
      'SendSignal',
      targetPeerId,
      JSON.stringify(signal)
    );
  }

  /**
   * Setup SignalR event handlers
   */
  private setupSignalRHandlers(): void {
    // User joined session
    this.connection.on('UserJoined', (data: { username: string; connectionId: string }) => {
      console.log('👤 User joined:', data.username);
      
      // Store username for this peer
      this.usernameMap.set(data.connectionId, data.username);
      
      this.emit('peer-joined', data.connectionId, data.username);

      // Initiate peer connection if under direct peer limit
      // Only initiate if our connectionId is "smaller" to avoid duplicate connections
      if (this.peers.size < (this.config.maxDirectPeers || 8)) {
        const myId = this.connection.connectionId || '';
        if (myId < data.connectionId) {
          console.log('🔄 Initiating offer to:', data.connectionId);
          this.createOffer(data.connectionId);
        } else {
          console.log('⏳ Waiting for offer from:', data.connectionId);
        }
      }
    });

    // User left session
    this.connection.on('UserLeft', (data: { username: string; connectionId: string }) => {
      console.log('👋 User left:', data.username);
      const peer = this.peers.get(data.connectionId);
      if (peer) {
        peer.connection.close();
        this.peers.delete(data.connectionId);
      }
      this.usernameMap.delete(data.connectionId);
      this.emit('peer-left', data.connectionId);
    });

    // Receive WebRTC signal
    this.connection.on('ReceiveSignal', async (fromPeer: string, signal: any) => {
      const signalData: SignalMessage = typeof signal === 'string' ? JSON.parse(signal) : signal;

      switch (signalData.type) {
        case 'offer':
          await this.handleOffer(fromPeer, signalData.data);
          break;
        case 'answer':
          await this.handleAnswer(fromPeer, signalData.data);
          break;
        case 'ice-candidate':
          await this.handleIceCandidate(fromPeer, signalData.data);
          break;
      }
    });

    // Mesh topology update
    this.connection.on('MeshUpdate', (topology: any) => {
      console.log('🕸️ Mesh topology updated:', topology);
      this.emit('mesh-update', topology);
    });

    // Relay promotion
    this.connection.on('RelayPromotion', (isRelay: boolean) => {
      console.log('🎖️ Relay status:', isRelay ? 'PROMOTED' : 'DEMOTED');
      this.emit('relay-promotion', isRelay);
    });
  }

  /**
   * Setup data channel for P2P signaling
   */
  private setupDataChannel(peerId: string, channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log('📡 Data channel opened with:', peerId);
    };

    channel.onmessage = (event) => {
      try {
        const signal: SignalMessage = decode(new Uint8Array(event.data)) as any;
        // Handle P2P signal without server
        this.handleP2PSignal(peerId, signal);
      } catch (error) {
        console.error('Failed to decode P2P signal:', error);
      }
    };

    channel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  }

  /**
   * Handle P2P signal received via data channel
   */
  private async handleP2PSignal(fromPeer: string, signal: SignalMessage): Promise<void> {
    // Forward to appropriate handler
    switch (signal.type) {
      case 'relay':
        // Handle relay forwarding
        const targetPeer = this.peers.get(signal.to);
        if (targetPeer?.dataChannel?.readyState === 'open') {
          const encoded = encode(signal) as Uint8Array;
          targetPeer.dataChannel.send(encoded as any);
        }
        break;
    }
  }

  /**
   * Measure latency to peer
   */
  private async measureLatency(peerId: string): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer?.connection) return;

    try {
      const stats = await peer.connection.getStats();
      stats.forEach((report: any) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          const rtt = report.currentRoundTripTime * 1000; // Convert to ms
          peer.latency = rtt;
          this.latencyMap.set(peerId, rtt);

          // Report latency to server for mesh optimization
          this.connection.invoke('UpdatePeerLatency', peerId, Math.round(rtt));
        }
      });
    } catch (error) {
      console.error('Failed to measure latency:', error);
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    setInterval(() => {
      if (this.connection.state === signalR.HubConnectionState.Connected) {
        this.connection.invoke('Heartbeat').catch(() => {
          console.warn('Heartbeat failed');
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Get session information
   */
  getSessionInfo(): SessionInfo | undefined {
    return this.sessionInfo;
  }

  /**
   * Get connected peers
   */
  getPeers(): PeerConnection[] {
    return Array.from(this.peers.values());
  }

  /**
   * Send custom message to specific peer via data channel
   */
  sendMessage(peerId: string, data: any): void {
    const peer = this.peers.get(peerId);
    if (peer?.dataChannel?.readyState === 'open') {
      const message = { type: 'custom-message', data };
      peer.dataChannel.send(JSON.stringify(message));
    } else {
      console.warn(`Cannot send message to ${peerId}: no open data channel`);
    }
  }

  /**
   * Broadcast message to all connected peers
   */
  broadcast(data: any): void {
    this.peers.forEach((peer, peerId) => {
      this.sendMessage(peerId, data);
    });
  }

  /**
   * Get WebRTC stats for a specific peer
   */
  async getStats(peerId?: string): Promise<any> {
    if (!peerId) {
      // Return aggregated stats for all peers
      const allStats: any[] = [];
      for (const [id, peer] of this.peers) {
        const stats = await peer.connection.getStats();
        allStats.push({ peerId: id, stats });
      }
      return allStats;
    }

    const peer = this.peers.get(peerId);
    if (!peer) return null;

    const stats = await peer.connection.getStats();
    const result: any = { latency: peer.latency, bitrate: 0, packetsLost: 0 };

    stats.forEach((report: any) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        result.bitrate = Math.round((report.bytesReceived * 8) / 1000); // kbps
        result.packetsLost = report.packetsLost || 0;
        result.jitter = report.jitter || 0;
      }
    });

    return result;
  }

  /**
   * Change video quality dynamically
   */
  setQuality(quality: string): void {
    this.config.quality = quality as any;
    // Note: In production, this should trigger renegotiation
    console.log(`Quality changed to: ${quality}`);
  }

  /**
   * Event emitter helpers
   */
  on<K extends keyof ClientEvents>(event: K, handler: ClientEvents[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler as Function);
  }

  off<K extends keyof ClientEvents>(event: K, handler: ClientEvents[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler as Function);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof ClientEvents>(event: K, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }
}
