# 🧪 Running SDK Examples

Quick guide to test the SmaRTC JavaScript SDK examples locally.

## Prerequisites

1. **SmaRTC Server Running**
   ```powershell
   cd deploy
   docker-compose -f docker-compose.zero-cost.yml up -d
   ```
   Server will be available at `http://localhost:5000`

2. **SDK Built**
   ```bash
   cd sdk/javascript-mesh
   npm install
   npm run build
   ```

## Running Examples

### Option 1: Simple HTTP Server (Recommended)

```bash
# From sdk/javascript-mesh directory
npx http-server . -p 8080 -c-1
```

Then open:
- **Simple Video Chat**: http://localhost:8080/examples/simple-video-chat.html

### Option 2: Live Server (VS Code Extension)

1. Install "Live Server" extension in VS Code
2. Right-click `simple-video-chat.html`
3. Select "Open with Live Server"

### Option 3: Python Server

```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

## Testing Multi-User Scenarios

### 1. Open Multiple Browser Windows

Open 3-4 browser windows/tabs:
- Window 1: `User-A`
- Window 2: `User-B`
- Window 3: `User-C`
- Window 4: `User-D`

All join the same session ID (e.g., `demo-room`)

### 2. Test Mesh Networking

With 4+ users, you'll see:
- **Full Mesh** strategy (< 20 users)
- Direct P2P connections between peers
- Latency measurements
- Real-time connection stats

### 3. Test Relay Capability

1. Check "Can Relay" for 1-2 users
2. Those users become potential relay nodes
3. Add more users to test relay routing

## Troubleshooting

### "Cannot access camera"
- Allow camera/microphone permissions when prompted
- Check browser console for errors
- Try HTTPS if HTTP fails (some browsers require HTTPS)

### "Connection failed"
- Verify server is running: `curl http://localhost:5000/health`
- Check Docker containers: `docker ps | grep smartc`
- View server logs: `docker logs smartc-signal-1`

### "No remote video"
- Wait a few seconds for WebRTC negotiation
- Check peer connection state in console
- Verify both users joined the same session

### Module errors
- Ensure SDK is built: `npm run build`
- Check `dist/` folder exists
- Re-run build if needed

## Example Features

### Simple Video Chat (`simple-video-chat.html`)

**Features:**
- ✅ Auto-generated username
- ✅ Quality selector (low/medium/high)
- ✅ Enable/disable P2P mesh
- ✅ Relay capability toggle
- ✅ Real-time connection stats
- ✅ Peer list with latency
- ✅ Video/audio toggle
- ✅ Responsive grid layout
- ✅ Beautiful UI with status indicators

**How to use:**
1. Open in browser
2. Enter session ID (or use default `demo-room`)
3. Click "Join Session"
4. Allow camera/mic access
5. Open another tab/window and repeat
6. See yourself and remote peer(s)!

## Performance Testing

### Measure Latency
Check the stats overlay on each video (updates every 2s):
```
📊 45ms | 1200kbps
```

### Monitor Mesh Strategy
Check "Connection Info" panel:
```
Mesh Strategy: fullMesh
Direct Peers: 3
Via Relay: 0
```

### View Browser Console
Press F12 and check console for:
```
✅ Connected to server
👤 Peer joined: User-1234
📹 Received stream from: User-1234
```

## Next Steps

Once examples work locally:
1. Deploy server to production (see `ZERO_COST_DEPLOYMENT.md`)
2. Use HTTPS for production
3. Add TURN server for firewall traversal
4. Customize UI to match your brand
5. Add authentication
6. Integrate with your backend

## Development Tips

### Live Reload
Use `npm run dev` for automatic rebuild:
```bash
npm run dev
```
SDK will rebuild on file changes.

### Debug Mode
Enable verbose logging:
```javascript
const client = new SmaRTCClient({
  // ... config
  logLevel: 'debug' // Add this
});
```

### Test Specific Scenarios
Modify `simple-video-chat.html` to test:
- Audio-only calls (remove video: true)
- Screen sharing (use getDisplayMedia)
- Different qualities
- Custom ICE servers

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ | Best performance |
| Edge | ✅ | Chromium-based |
| Firefox | ✅ | Good support |
| Safari | ⚠️ | Requires HTTPS |
| Opera | ✅ | Chromium-based |

## Common Test Scenarios

### Scenario 1: Simple 1-on-1
- 2 users
- Same session
- Full Mesh
- Latency < 100ms

### Scenario 2: Small Group (4 users)
- 4 users
- Same session
- Full Mesh
- Direct connections: 3 peers each

### Scenario 3: Medium Group (8 users)
- 8 users
- Mesh enabled
- Some direct, some relayed
- Hybrid strategy

### Scenario 4: Network Quality Test
- Set quality to "low"
- Measure latency and bitrate
- Compare to "high"
- Check video quality

---

**Happy Testing! 🎉**
