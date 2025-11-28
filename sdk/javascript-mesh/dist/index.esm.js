import * as signalR from '@microsoft/signalr';
import { encode, decode } from '@msgpack/msgpack';

/**
 * SmaRTC Client - Main WebRTC Client with Mesh Support
 * Handles connection, signaling, and peer management
 */
class SmaRTCClient {
    constructor(config) {
        this.peers = new Map();
        this.eventHandlers = new Map();
        this.latencyMap = new Map();
        this.config = {
            maxDirectPeers: 8,
            enableMesh: true,
            canRelay: false,
            quality: 'medium',
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
    async connect(localStream) {
        this.localStream = localStream;
        try {
            await this.connection.start();
            console.log('✅ Connected to SmaRTC server');
            // Join session
            await this.connection.invoke('JoinSession', this.config.sessionId, this.config.username);
            // Set relay capability if enabled
            if (this.config.canRelay) {
                await this.connection.invoke('SetRelayCapability', true);
            }
            this.emit('connected');
            this.startHeartbeat();
        }
        catch (error) {
            console.error('❌ Connection failed:', error);
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Disconnect from server and close all peer connections
     */
    async disconnect() {
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
    async createPeerConnection(peerId) {
        const config = {
            iceServers: this.config.iceServers || [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: `stun:${this.config.serverUrl.replace(/^https?:\/\//, '')}:3478` }
            ]
        };
        const pc = new RTCPeerConnection(config);
        // Add local stream tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream);
            });
        }
        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('📹 Received remote stream from:', peerId);
            this.emit('remote-stream', peerId, event.streams[0]);
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
            }
            else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
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
    async createOffer(peerId) {
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
    async handleOffer(peerId, offer) {
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
    async handleAnswer(peerId, answer) {
        const peer = this.peers.get(peerId);
        if (peer) {
            await peer.connection.setRemoteDescription(answer);
        }
    }
    /**
     * Handle incoming ICE candidate
     */
    async handleIceCandidate(peerId, candidate) {
        const peer = this.peers.get(peerId);
        if (peer) {
            await peer.connection.addIceCandidate(candidate);
        }
    }
    /**
     * Send signal through SignalR (fallback) or DataChannel (preferred)
     */
    async sendSignal(targetPeerId, signal) {
        const peer = this.peers.get(targetPeerId);
        // Try to send via DataChannel first (zero server cost!)
        if (peer?.dataChannel?.readyState === 'open') {
            const encoded = encode(signal);
            peer.dataChannel.send(encoded);
            return;
        }
        // Fallback to SignalR
        await this.connection.invoke('SendSignal', targetPeerId, JSON.stringify(signal));
    }
    /**
     * Setup SignalR event handlers
     */
    setupSignalRHandlers() {
        // User joined session
        this.connection.on('UserJoined', (data) => {
            console.log('👤 User joined:', data.username);
            this.emit('peer-joined', data.connectionId);
            // Initiate peer connection if under direct peer limit
            if (this.peers.size < (this.config.maxDirectPeers || 8)) {
                this.createOffer(data.connectionId);
            }
        });
        // User left session
        this.connection.on('UserLeft', (data) => {
            console.log('👋 User left:', data.username);
            const peer = this.peers.get(data.connectionId);
            if (peer) {
                peer.connection.close();
                this.peers.delete(data.connectionId);
            }
            this.emit('peer-left', data.connectionId);
        });
        // Receive WebRTC signal
        this.connection.on('ReceiveSignal', async (fromPeer, signal) => {
            const signalData = typeof signal === 'string' ? JSON.parse(signal) : signal;
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
        this.connection.on('MeshUpdate', (topology) => {
            console.log('🕸️ Mesh topology updated:', topology);
            this.emit('mesh-update', topology);
        });
        // Relay promotion
        this.connection.on('RelayPromotion', (isRelay) => {
            console.log('🎖️ Relay status:', isRelay ? 'PROMOTED' : 'DEMOTED');
            this.emit('relay-promotion', isRelay);
        });
    }
    /**
     * Setup data channel for P2P signaling
     */
    setupDataChannel(peerId, channel) {
        channel.onopen = () => {
            console.log('📡 Data channel opened with:', peerId);
        };
        channel.onmessage = (event) => {
            try {
                const signal = decode(new Uint8Array(event.data));
                // Handle P2P signal without server
                this.handleP2PSignal(peerId, signal);
            }
            catch (error) {
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
    async handleP2PSignal(fromPeer, signal) {
        // Forward to appropriate handler
        switch (signal.type) {
            case 'relay':
                // Handle relay forwarding
                const targetPeer = this.peers.get(signal.to);
                if (targetPeer?.dataChannel?.readyState === 'open') {
                    const encoded = encode(signal);
                    targetPeer.dataChannel.send(encoded);
                }
                break;
        }
    }
    /**
     * Measure latency to peer
     */
    async measureLatency(peerId) {
        const peer = this.peers.get(peerId);
        if (!peer?.connection)
            return;
        try {
            const stats = await peer.connection.getStats();
            stats.forEach((report) => {
                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    const rtt = report.currentRoundTripTime * 1000; // Convert to ms
                    peer.latency = rtt;
                    this.latencyMap.set(peerId, rtt);
                    // Report latency to server for mesh optimization
                    this.connection.invoke('UpdatePeerLatency', peerId, Math.round(rtt));
                }
            });
        }
        catch (error) {
            console.error('Failed to measure latency:', error);
        }
    }
    /**
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
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
    getSessionInfo() {
        return this.sessionInfo;
    }
    /**
     * Get connected peers
     */
    getPeers() {
        return Array.from(this.peers.values());
    }
    /**
     * Send custom message to specific peer via data channel
     */
    sendMessage(peerId, data) {
        const peer = this.peers.get(peerId);
        if (peer?.dataChannel?.readyState === 'open') {
            const message = { type: 'custom-message', data };
            peer.dataChannel.send(JSON.stringify(message));
        }
        else {
            console.warn(`Cannot send message to ${peerId}: no open data channel`);
        }
    }
    /**
     * Broadcast message to all connected peers
     */
    broadcast(data) {
        this.peers.forEach((peer, peerId) => {
            this.sendMessage(peerId, data);
        });
    }
    /**
     * Get WebRTC stats for a specific peer
     */
    async getStats(peerId) {
        if (!peerId) {
            // Return aggregated stats for all peers
            const allStats = [];
            for (const [id, peer] of this.peers) {
                const stats = await peer.connection.getStats();
                allStats.push({ peerId: id, stats });
            }
            return allStats;
        }
        const peer = this.peers.get(peerId);
        if (!peer)
            return null;
        const stats = await peer.connection.getStats();
        const result = { latency: peer.latency, bitrate: 0, packetsLost: 0 };
        stats.forEach((report) => {
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
    setQuality(quality) {
        this.config.quality = quality;
        // Note: In production, this should trigger renegotiation
        console.log(`Quality changed to: ${quality}`);
    }
    /**
     * Event emitter helpers
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    emit(event, ...args) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(...args));
        }
    }
}

/**
 * Adaptive Mesh Network Client
 * Handles intelligent peer routing and relay management
 */
class AdaptiveMeshClient extends SmaRTCClient {
    constructor(config) {
        super({ ...config, enableMesh: true });
        this.routingStrategy = 'fullMesh';
        this.relayNodes = new Set();
        this.directPeers = new Set();
        this.setupMeshHandlers();
    }
    /**
     * Setup mesh-specific event handlers
     */
    setupMeshHandlers() {
        this.on('mesh-update', (topology) => {
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
    async optimizeConnections() {
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
        this.relayNodes.forEach(async (relayId) => {
            const existingPeer = currentPeers.find(p => p.peerId === relayId);
            if (!existingPeer) {
                await this.createOffer(relayId);
            }
        });
    }
    /**
     * Get optimal routing path for a message
     */
    getRoutingPath(targetPeerId) {
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
            const bestRelay = relayPeers.reduce((best, current) => current.latency < best.latency ? current : best);
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

/**
 * Differential Video Decoder (Client-Side)
 * Decodes compressed video frames from SmaRTC server
 */
class DifferentialVideoDecoder {
    constructor(width, height) {
        this.previousFrame = null;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
    }
    /**
     * Decode compressed frame
     */
    decode(compressedData) {
        const isKeyframe = compressedData[0] === 0xFF;
        if (isKeyframe) {
            return this.decodeKeyframe(compressedData);
        }
        else {
            return this.decodeDeltaFrame(compressedData);
        }
    }
    /**
     * Decode keyframe (full frame)
     */
    decodeKeyframe(data) {
        // Placeholder: In production, implement full decompression
        const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
        // Simple RLE decompression (matches server encoder)
        let dataIndex = 2; // Skip header
        let pixelIndex = 0;
        while (dataIndex < data.length && pixelIndex < imageData.data.length) {
            if (data[dataIndex] === 0xFF) {
                // RLE marker
                const count = data[dataIndex + 1];
                const value = data[dataIndex + 2];
                for (let i = 0; i < count; i++) {
                    imageData.data[pixelIndex++] = value;
                }
                dataIndex += 3;
            }
            else {
                // Literal
                imageData.data[pixelIndex++] = data[dataIndex++];
            }
        }
        this.previousFrame = imageData;
        return imageData;
    }
    /**
     * Decode delta frame (only changes)
     */
    decodeDeltaFrame(data) {
        if (!this.previousFrame) {
            throw new Error('No previous frame for delta decoding');
        }
        // Clone previous frame
        const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
        imageData.data.set(this.previousFrame.data);
        // Apply delta changes
        let dataIndex = 1; // Skip header
        const changedBlocks = (data[dataIndex] | (data[dataIndex + 1] << 8));
        dataIndex += 2;
        // Decode each changed block
        for (let i = 0; i < changedBlocks; i++) {
            const blockX = data[dataIndex++];
            const blockY = data[dataIndex++];
            // Decode block data (simplified)
            // In production: implement full block decode with dequantization
            const blockSize = 8;
            (blockY * blockSize * this.canvas.width + blockX * blockSize) * 4;
            // Read compressed block data
            // ... (implementation details)
        }
        this.previousFrame = imageData;
        return imageData;
    }
    /**
     * Get decoded frame as canvas element
     */
    getCanvas() {
        return this.canvas;
    }
    /**
     * Render decoded frame to target canvas
     */
    renderTo(targetCanvas) {
        const targetCtx = targetCanvas.getContext('2d');
        targetCtx.drawImage(this.canvas, 0, 0, targetCanvas.width, targetCanvas.height);
    }
}

/**
 * SmaRTC Easy API - Simplified wrapper for quick integration
 * Zero boilerplate, maximum productivity
 */
/**
 * Easy API - Simplified SmaRTC client
 * Perfect for quick prototypes and simple use cases
 */
class SmaRTCEasy {
    constructor(config, callbacks = {}) {
        this.config = {
            userName: `User-${Math.random().toString(36).substr(2, 5)}`,
            videoQuality: 'medium',
            audioOnly: false,
            autoJoin: false,
            ...config
        };
        this.callbacks = callbacks;
        // Create underlying client
        const clientConfig = {
            serverUrl: this.config.serverUrl,
            sessionId: this.config.roomId,
            username: this.config.userName,
            quality: this.config.videoQuality, // Type conversion for enum
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
    async join() {
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
        }
        catch (error) {
            console.error('Failed to join:', error);
            this.callbacks.onError?.(error);
            throw error;
        }
    }
    /**
     * Leave the room (disconnects and stops camera/mic)
     */
    async leave() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = undefined;
        }
        await this.client.disconnect();
    }
    /**
     * Get local media stream
     */
    getLocalStream() {
        return this.localStream;
    }
    /**
     * Toggle video on/off
     */
    toggleVideo(enabled) {
        if (!this.localStream)
            return false;
        const videoTracks = this.localStream.getVideoTracks();
        if (videoTracks.length === 0)
            return false;
        const newState = enabled ?? !videoTracks[0].enabled;
        videoTracks.forEach(track => track.enabled = newState);
        return newState;
    }
    /**
     * Toggle audio on/off
     */
    toggleAudio(enabled) {
        if (!this.localStream)
            return false;
        const audioTracks = this.localStream.getAudioTracks();
        if (audioTracks.length === 0)
            return false;
        const newState = enabled ?? !audioTracks[0].enabled;
        audioTracks.forEach(track => track.enabled = newState);
        return newState;
    }
    /**
     * Change video quality
     */
    setQuality(quality) {
        this.config.videoQuality = quality;
        // Note: Quality change requires re-negotiation in real implementation
        console.warn('Quality change will take effect on next session');
    }
    /**
     * Get list of connected peers
     */
    getPeers() {
        return this.client.getPeers().map(peer => ({
            id: peer.peerId,
            latency: peer.latency
        }));
    }
    /**
     * Get room statistics
     */
    getRoomStats() {
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
    sendMessageToPeer(peerId, message) {
        this.client.sendMessage(peerId, message);
    }
    /**
     * Broadcast message to all peers
     */
    broadcast(message) {
        this.client.broadcast(message);
    }
    /**
     * Listen for custom messages
     */
    onMessage(callback) {
        this.client.on('message', callback);
    }
    // Private methods
    setupEventHandlers() {
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
    getVideoWidth() {
        switch (this.config.videoQuality) {
            case 'low': return 640;
            case 'medium': return 1280;
            case 'high': return 1920;
            default: return 1280;
        }
    }
    getVideoHeight() {
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
async function quickJoin(serverUrl, roomId, callbacks = {}) {
    const client = new SmaRTCEasy({ serverUrl, roomId, autoJoin: false }, callbacks);
    await client.join();
    return client;
}

/**
 * Type definitions for SmaRTC Zero-Cost SDK
 */
var QualityLevel;
(function (QualityLevel) {
    QualityLevel["VeryLow"] = "veryLow";
    QualityLevel["Low"] = "low";
    QualityLevel["Medium"] = "medium";
    QualityLevel["High"] = "high";
    QualityLevel["VeryHigh"] = "veryHigh"; // 720p, ~800kbps
})(QualityLevel || (QualityLevel = {}));
var RoutingStrategy;
(function (RoutingStrategy) {
    RoutingStrategy["FullMesh"] = "fullMesh";
    RoutingStrategy["Hybrid"] = "hybrid";
    RoutingStrategy["RelayBased"] = "relayBased";
})(RoutingStrategy || (RoutingStrategy = {}));

/**
 * Utility functions for SmaRTC Client
 */
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
function calculateBandwidth(bytes, durationMs) {
    return (bytes * 8) / (durationMs / 1000); // bits per second
}
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
function debounce(func, wait) {
    let timeout = null;
    return (...args) => {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

export { AdaptiveMeshClient, DifferentialVideoDecoder, QualityLevel, RoutingStrategy, SmaRTCClient, SmaRTCEasy, calculateBandwidth, debounce, formatBytes, generateId, quickJoin, throttle };
//# sourceMappingURL=index.esm.js.map
