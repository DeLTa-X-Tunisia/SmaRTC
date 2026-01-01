# ⚡ Quick Start: Build & Deploy Zero-Cost Version

## 🚀 1-Minute Deployment

```bash
# Clone repository
git clone https://github.com/DeLTa-X-Tunisia/SmaRTC
cd SmaRTC

# Build optimized version
cd signal-server
dotnet publish signal-server.optimized.csproj -c Release

# Or use Docker
cd ../deploy
docker-compose -f docker-compose.zero-cost.yml build
docker-compose -f docker-compose.zero-cost.yml up -d

# Scale to 10 instances for 1M users
docker-compose -f docker-compose.zero-cost.yml up -d --scale signal-server=10

# Check status
curl http://localhost/health
```

## 📊 Monitor Performance

```bash
# Real-time stats
docker stats

# HAProxy dashboard
open http://localhost:8404/stats

# Grafana dashboards
open http://localhost:3000
# Login: admin / zerocost2024
```

## 🧪 Load Test

```bash
# Install Artillery
npm install -g artillery

# Run basic load test
artillery quick --count 1000 --num 10 ws://localhost/signalhub

# Full test suite
cd load-tests
artillery run connection-capacity.yml
```

## 📈 Expected Results

**Single Instance (4GB RAM)**:
- ✅ 100,000 concurrent connections
- ✅ <1GB memory usage
- ✅ <50% CPU usage
- ✅ <200ms P95 latency

**10 Instances (40GB RAM total)**:
- ✅ 1,000,000 concurrent connections
- ✅ ~10GB memory usage
- ✅ <30% average CPU
- ✅ <200ms P95 latency

## 🎯 Next Steps

1. Read [ZERO_COST_DEPLOYMENT.md](ZERO_COST_DEPLOYMENT.md) for cloud setup
2. Check [ZERO_COST_BENCHMARKS.md](ZERO_COST_BENCHMARKS.md) for performance data
3. Configure production settings in `.env`
4. Set up monitoring with Grafana Cloud (free)
5. Deploy to Oracle Cloud (free 200k users)

## 🆘 Troubleshooting

**Issue**: Can't build optimized version  
**Fix**: Ensure .NET 9 SDK installed: `dotnet --version`

**Issue**: Container fails to start  
**Fix**: Check logs: `docker logs smartc-signal-1`

**Issue**: High memory usage  
**Fix**: Reduce replicas or scale horizontally

## 📚 Documentation

- [Architecture Overview](../README.md#architecture-overview)
- [API Reference](../api/README.md)
- [SDK Documentation](../sdk/README.md)
- [Deployment Guide](ZERO_COST_DEPLOYMENT.md)
- [Performance Benchmarks](ZERO_COST_BENCHMARKS.md)

---

**Built with ❤️ in Tunisia 🇹🇳**  
**Author**: Azizi Mounir | +216 27 774 075
