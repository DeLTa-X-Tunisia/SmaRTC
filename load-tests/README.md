# 🧪 Load Testing Guide for SmaRTC Zero-Cost

## 📋 Prerequisites

```bash
# Install Artillery
npm install -g artillery

# Verify installation
artillery version
```

## 🚀 Quick Test

```bash
# Navigate to load tests
cd load-tests

# Run basic connection test (1000 connections)
artillery quick --count 1000 --num 10 ws://localhost/signalhub

# Expected output:
# ✓ Created 1000 virtual users
# ✓ Scenarios launched: 10000
# ✓ Errors: < 1%
```

## 📊 Full Test Suite

### 1. Connection Capacity Test (100k connections)
```bash
artillery run connection-capacity.yml

# What it tests:
# - Gradual ramp to 100k concurrent WebSocket connections
# - Connection pooling efficiency
# - Memory usage per connection
# - Sustained load handling

# Expected results:
# ✓ 100k concurrent connections
# ✓ Memory: ~1GB
# ✓ CPU: 30-50%
# ✓ P95 latency: <200ms
# ✓ Success rate: >99%

# Duration: ~20 minutes
```

### 2. Message Throughput Test (10k msg/sec)
```bash
artillery run message-throughput.yml

# What it tests:
# - SignalR message handling capacity
# - Queue performance under load
# - MessagePack serialization speed
# - Broadcast efficiency

# Expected results:
# ✓ 10,000+ messages/second
# ✓ Avg latency: 50-100ms
# ✓ P95 latency: <200ms
# ✓ No message loss

# Duration: ~5 minutes
```

### 3. Session Scaling Test (1000 sessions)
```bash
artillery run session-scaling.yml

# What it tests:
# - Mesh network adaptation (full mesh → hybrid → relay)
# - Relay node auto-selection
# - Route optimization
# - Large session handling (100+ users)

# Expected results:
# ✓ 1000 concurrent sessions
# ✓ Mesh strategy adapts correctly
# ✓ Relay nodes selected automatically
# ✓ Latency stays <300ms even in large sessions

# Duration: ~12 minutes
```

### 4. Stress Test (Find breaking point)
```bash
artillery run stress-test.yml

# What it tests:
# - System behavior under extreme load
# - Graceful degradation
# - Recovery after overload
# - Memory leak detection

# Expected behavior:
# ✓ Graceful degradation (no crash)
# ✓ Connection throttling activates
# ✓ Health endpoint stays responsive
# ✓ Quick recovery when load reduces

# Duration: ~12 minutes
# WARNING: This WILL push your system to limits!
```

## 📈 Run All Tests (Sequential)

```bash
# Full test suite
./run-all-tests.ps1

# Or manually:
artillery run connection-capacity.yml
sleep 60  # Cool-down period
artillery run message-throughput.yml
sleep 60
artillery run session-scaling.yml
sleep 60
artillery run stress-test.yml
```

## 🔍 Monitoring During Tests

### Terminal 1: Run test
```bash
artillery run connection-capacity.yml
```

### Terminal 2: Monitor Docker stats
```powershell
# Continuous monitoring
while ($true) {
    Clear-Host
    Write-Host "=== $(Get-Date) ===" -ForegroundColor Cyan
    docker stats --no-stream
    Start-Sleep -Seconds 5
}
```

### Terminal 3: Monitor application stats
```powershell
# Watch application metrics
while ($true) {
    Clear-Host
    Write-Host "=== SmaRTC Stats ===" -ForegroundColor Cyan
    curl -s http://localhost/stats | ConvertFrom-Json | Format-List
    Start-Sleep -Seconds 10
}
```

### Browser: HAProxy dashboard
```
Open: http://localhost:8404/stats
Login: admin / zerocost2024
```

## 📊 Understanding Results

### Good Results ✅
```
Summary report:
  scenarios launched: 100000
  scenarios completed: 99800
  requests sent: 500000
  errors: 200 (0.4%)
  
  http.response_time:
    min: 23
    max: 456
    median: 67
    p95: 178
    p99: 423

Status: ✓ PASS - System handling load well!
```

### Warning Signs ⚠️
```
errors: 5000 (5%)  # >5% error rate
p95: 850           # Latency degrading
p99: 2340          # High tail latency

Action: Scale horizontally or optimize
```

### Critical Issues ❌
```
errors: 15000 (15%)  # >10% error rate
p95: 5000           # Severe latency
Timeouts: Many

Action: Immediate investigation needed!
```

## 🎯 Performance Targets by Test

| Test | Target | Good | Warning | Critical |
|------|--------|------|---------|----------|
| **Connection Capacity** |
| Max connections | 100k | 98k+ | 80k-98k | <80k |
| Error rate | <1% | <1% | 1-5% | >5% |
| P95 latency | <200ms | <200ms | 200-500ms | >500ms |
| Memory usage | ~1GB | <1.2GB | 1.2-1.5GB | >1.5GB |
| **Message Throughput** |
| Messages/sec | 10k | 9k+ | 5k-9k | <5k |
| P95 latency | <200ms | <200ms | 200-500ms | >500ms |
| **Session Scaling** |
| Sessions | 1000 | 900+ | 500-900 | <500 |
| Mesh adaptation | Auto | ✓ | Slow | ✗ |
| **Stress Test** |
| Degradation | Graceful | ✓ | Sudden | Crash |
| Recovery | <60s | <60s | 60-300s | >300s |

## 🔧 Troubleshooting

### Issue: Can't reach 100k connections
**Causes:**
- OS file descriptor limits
- Network port exhaustion
- Insufficient memory

**Solutions:**
```bash
# Increase file descriptor limit (Linux)
ulimit -n 1000000

# Increase ephemeral ports (Linux)
sudo sysctl -w net.ipv4.ip_local_port_range="1024 65535"
sudo sysctl -w net.ipv4.tcp_tw_reuse=1

# Windows: Increase dynamic ports
netsh int ipv4 set dynamicport tcp start=1025 num=64511
```

### Issue: High latency during tests
**Causes:**
- CPU throttling
- Memory swapping
- Network congestion

**Solutions:**
```bash
# Scale horizontally
docker-compose up -d --scale signal-server=5

# Increase resources
docker update --memory=2g --cpus=4 smartc-signal-1

# Check for swapping
docker stats
```

### Issue: Memory keeps growing
**Causes:**
- Memory leaks
- Insufficient GC
- Connection cleanup issues

**Solutions:**
```bash
# Force GC
curl -X POST http://localhost/admin/gc

# Check for leaks
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}"

# Restart if needed
docker-compose restart signal-server
```

## 📚 Advanced Testing

### Custom Test Creation
```yaml
# custom-test.yml
config:
  target: "ws://localhost"
  phases:
    - duration: 60
      arrivalRate: 100
  
scenarios:
  - name: "My Custom Test"
    engine: ws
    flow:
      - connect:
          url: "/signalhub"
      - send:
          payload: '{"protocol":"json","version":1}'
      # Add your test logic here
```

### Distributed Load Testing
```bash
# Run from multiple machines
# Machine 1:
artillery run connection-capacity.yml

# Machine 2:
artillery run connection-capacity.yml

# Machine 3:
artillery run connection-capacity.yml

# Combined load: 300k connections!
```

### Continuous Load Testing
```bash
# Run tests in loop (soak test)
while true; do
  artillery run message-throughput.yml
  sleep 300  # 5 min cooldown
done
```

## 📊 Results Analysis

### Generate HTML Report
```bash
artillery run connection-capacity.yml --output report.json
artillery report report.json --output report.html
```

### Export Metrics to CSV
```bash
# Custom script to parse Artillery JSON output
node parse-results.js report.json > results.csv
```

### Send to Monitoring
```bash
# Push metrics to Grafana Cloud
artillery run test.yml | artillery-plugin-cloudwatch
```

## 🎓 Tips & Best Practices

1. **Always run baseline first** - Know your system's normal performance
2. **Monitor during tests** - Watch for anomalies in real-time
3. **Cool-down between tests** - Let system stabilize (60s minimum)
4. **Scale gradually** - Don't jump from 1k to 100k instantly
5. **Document results** - Track improvements over time
6. **Test production-like env** - Use similar hardware/network
7. **Run multiple times** - Results should be consistent

## 🚨 Load Testing Checklist

Before running load tests:
- [ ] System resources adequate (RAM, CPU)
- [ ] File descriptor limits increased
- [ ] Monitoring tools ready
- [ ] Baseline metrics captured
- [ ] Alerting configured
- [ ] Recovery plan prepared
- [ ] Team notified (if production)

---

**Ready to push SmaRTC to its limits? Let's go! 🚀**
