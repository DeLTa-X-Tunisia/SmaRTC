# 🚀 SmaRTC JavaScript SDK with Mesh Networking

Ultra-optimized WebRTC client for SmaRTC Zero-Cost edition with adaptive mesh networking support.

## ✨ Features

- 🕸️ **Adaptive Mesh Networking** - Auto-switches between full mesh, hybrid, and relay strategies
- ⚡ **Zero Server Cost** - P2P data channels reduce server bandwidth by 90%+
- 📦 **MessagePack Protocol** - 60% smaller payloads than JSON
- 🎥 **Adaptive Quality** - Auto-adjusts video quality based on bandwidth
- 📊 **Built-in Monitoring** - Real-time latency and bandwidth stats
- 🔄 **Auto-Reconnect** - Resilient connection handling
- 💪 **TypeScript** - Full type safety

## 📦 Installation

```bash
npm install @smartc/client-mesh
```

## 🚀 Quick Start

```typescript
import { SmaRTCClient } from '@smartc/client-mesh';

// Initialize client
const client = new SmaRTCClient({
  serverUrl: 'http://localhost',
  sessionId: 'my-session',
  username: 'John',
  enableMesh: true,
  canRelay: true  // Opt-in to help others (better for everyone!)
});

// Get local media
const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: 640, height: 480 },
  audio: true
});

// Connect to session
await client.connect(stream);

// Handle remote streams
client.on('remote-stream', (peerId, stream) => {
  const video = document.getElementById('remote-video');
  video.srcObject = stream;
});

// Monitor mesh network
client.on('mesh-update', (topology) => {
  console.log('Mesh strategy:', topology.strategy);
  console.log('Direct peers:', topology.directPeers.length);
  console.log('Relay nodes:', topology.relayNodes.length);
});
```

## 🕸️ Adaptive Mesh Client

For advanced mesh networking features:

```typescript
import { AdaptiveMeshClient } from '@smartc/client-mesh';

const client = new AdaptiveMeshClient({
  serverUrl: 'http://localhost',
  sessionId: 'large-meeting',
  username: 'Host',
  maxDirectPeers: 8,  // Limit direct connections
  canRelay: true      // Become a relay node for others
});

await client.connect(stream);

// Get mesh statistics
setInterval(() => {
  const stats = client.getMeshStats();
  console.log('Mesh Stats:', stats);
  // {
  //   strategy: 'relayBased',
  //   totalPeers: 95,
  //   directPeers: 8,
  //   relayNodes: 10,
  //   averageLatency: 67,
  //   minLatency: 23,
  //   maxLatency: 198
  // }
}, 5000);

// Get optimal routing path to a peer
const path = client.getRoutingPath('peer-id-123');
console.log('Route:', path); // ['relay-node-5', 'peer-id-123']
```

## 📚 API Reference

### SmaRTCClient

#### Constructor Options

```typescript
interface ConnectionConfig {
  serverUrl: string;           // SmaRTC server URL
  sessionId: string;            // Session to join
  username: string;             // Your username
  enableMesh?: boolean;         // Enable mesh networking (default: true)
  canRelay?: boolean;           // Allow relaying for others (default: false)
  maxDirectPeers?: number;      // Max direct connections (default: 8)
  iceServers?: RTCIceServer[];  // Custom STUN/TURN servers
  codec?: 'vp8' | 'vp9' | 'h264'; // Video codec preference
  quality?: QualityLevel;       // Initial quality level
}
```

#### Methods

**connect(localStream?: MediaStream): Promise<void>**
Connect to SmaRTC server and join session.

**disconnect(): Promise<void>**
Disconnect and cleanup all resources.

**createOffer(peerId: string): Promise<void>**
Create WebRTC offer to peer.

**getPeers(): PeerConnection[]**
Get list of connected peers.

**getSessionInfo(): SessionInfo | undefined**
Get current session information.

#### Events

```typescript
client.on('connected', () => {
  console.log('Connected to server');
});

client.on('disconnected', () => {
  console.log('Disconnected');
});

client.on('peer-joined', (peerId: string) => {
  console.log('Peer joined:', peerId);
});

client.on('peer-left', (peerId: string) => {
  console.log('Peer left:', peerId);
});

client.on('remote-stream', (peerId: string, stream: MediaStream) => {
  // Handle remote video/audio stream
});

client.on('mesh-update', (topology: MeshTopologyUpdate) => {
  // Mesh network topology changed
});

client.on('quality-changed', (quality: QualityLevel) => {
  // Video quality adjusted
});

client.on('relay-promotion', (isRelay: boolean) => {
  // You've been promoted/demoted as relay node
});

client.on('stats', (stats: MediaStats) => {
  // Periodic performance stats
});

client.on('error', (error: Error) => {
  console.error('Error:', error);
});
```

### AdaptiveMeshClient

Extends `SmaRTCClient` with additional mesh networking features.

**getMeshStats(): MeshStats**
Get detailed mesh network statistics.

**getRoutingPath(targetPeerId: string): string[]**
Get optimal routing path to reach a peer.

## 🎯 Quality Levels

```typescript
enum QualityLevel {
  VeryLow = 'veryLow',    // 144p, ~50kbps
  Low = 'low',            // 240p, ~100kbps
  Medium = 'medium',      // 360p, ~200kbps (default)
  High = 'high',          // 480p, ~400kbps
  VeryHigh = 'veryHigh'   // 720p, ~800kbps
}
```

Quality automatically adapts based on network conditions.

## 🕸️ Mesh Strategies

The SDK automatically chooses the best strategy:

| Participants | Strategy | Description |
|--------------|----------|-------------|
| < 20 | **Full Mesh** | Everyone connects to everyone |
| 20-50 | **Hybrid** | Mix of direct + relay connections |
| 50+ | **Relay-Based** | Most traffic goes through relay nodes |

## 💡 Best Practices

### 1. Enable Relay on Stable Connections
```typescript
// If you have good bandwidth/CPU, help others!
const client = new SmaRTCClient({
  canRelay: true,
  // ...
});
```

### 2. Limit Direct Peers in Large Sessions
```typescript
// For meetings with 50+ people
const client = new SmaRTCClient({
  maxDirectPeers: 5,  // Reduce from default 8
  // ...
});
```

### 3. Monitor Connection Quality
```typescript
client.on('stats', (stats) => {
  if (stats.packetsLost > 100) {
    console.warn('High packet loss detected');
    // Maybe switch to audio-only mode
  }
});
```

### 4. Handle Errors Gracefully
```typescript
client.on('error', async (error) => {
  console.error('Connection error:', error);
  
  // Retry connection
  await client.disconnect();
  await new Promise(resolve => setTimeout(resolve, 2000));
  await client.connect(stream);
});
```

## 🧪 Example: Complete Video Conference

```typescript
import { AdaptiveMeshClient, QualityLevel } from '@smartc/client-mesh';

class VideoConference {
  private client: AdaptiveMeshClient;
  private localStream?: MediaStream;
  private remotePeers = new Map<string, HTMLVideoElement>();

  async init(sessionId: string, username: string) {
    // Get local media
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    // Display local video
    const localVideo = document.getElementById('local-video') as HTMLVideoElement;
    localVideo.srcObject = this.localStream;

    // Initialize client
    this.client = new AdaptiveMeshClient({
      serverUrl: window.location.origin,
      sessionId,
      username,
      canRelay: true,
      quality: QualityLevel.Medium
    });

    // Setup event handlers
    this.setupEventHandlers();

    // Connect
    await this.client.connect(this.localStream);
  }

  private setupEventHandlers() {
    // Handle new participants
    this.client.on('remote-stream', (peerId, stream) => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.id = `peer-${peerId}`;
      
      document.getElementById('remote-videos')!.appendChild(video);
      this.remotePeers.set(peerId, video);
    });

    // Handle participants leaving
    this.client.on('peer-left', (peerId) => {
      const video = this.remotePeers.get(peerId);
      if (video) {
        video.remove();
        this.remotePeers.delete(peerId);
      }
    });

    // Monitor mesh network
    this.client.on('mesh-update', (topology) => {
      const statsDiv = document.getElementById('mesh-stats')!;
      statsDiv.innerHTML = `
        Strategy: ${topology.strategy}<br>
        Direct Peers: ${topology.directPeers.length}<br>
        Relay Nodes: ${topology.relayNodes.length}
      `;
    });

    // Display stats
    setInterval(() => {
      const stats = this.client.getMeshStats();
      const statsDiv = document.getElementById('connection-stats')!;
      statsDiv.innerHTML = `
        Total Peers: ${stats.totalPeers}<br>
        Avg Latency: ${Math.round(stats.averageLatency)}ms<br>
        Strategy: ${stats.strategy}
      `;
    }, 2000);
  }

  async disconnect() {
    await this.client.disconnect();
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // Remove all remote videos
    this.remotePeers.forEach(video => video.remove());
    this.remotePeers.clear();
  }
}

// Usage
const conference = new VideoConference();
await conference.init('my-meeting', 'Alice');
```

## 📊 Performance Tips

1. **Use Audio-Only Mode for Large Groups** (50+ people)
   ```typescript
   const stream = await navigator.mediaDevices.getUserMedia({
     video: false,
     audio: true
   });
   ```

2. **Enable Simulcast for Large Sessions**
   ```typescript
   pc.addTransceiver('video', {
     direction: 'sendrecv',
     sendEncodings: [
       { rid: 'q', scaleResolutionDownBy: 4.0 },
       { rid: 'h', scaleResolutionDownBy: 2.0 },
       { rid: 'f', scaleResolutionDownBy: 1.0 }
     ]
   });
   ```

3. **Opt-in as Relay if You Have Resources**
   - Stable internet connection
   - Good CPU/RAM
   - Not on battery/mobile

## 🐛 Troubleshooting

**Can't connect to peer?**
- Check firewall settings
- Verify STUN server is accessible
- Try with TURN server for NAT traversal

**High latency?**
- Check network conditions
- Reduce video quality
- Limit number of direct peers

**Video freezing?**
- Bandwidth congestion
- Too many concurrent streams
- Switch to audio-only temporarily

## 📚 Additional Resources

- [SmaRTC Documentation](../../docs/)
- [WebRTC Best Practices](https://webrtc.org/getting-started/overview)
- [Mesh Networking Guide](../../docs/mesh-architecture.md)

## 📄 License

MIT © Azizi Mounir

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](../../CONTRIBUTING.md).

---

**Built with ❤️ for zero-cost scaling** 🚀🇹🇳
