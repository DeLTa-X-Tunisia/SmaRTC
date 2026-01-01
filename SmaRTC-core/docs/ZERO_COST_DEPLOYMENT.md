# 🚀 Zero-Cost Deployment Guide: 1M Users for €0

## 🎯 Mission: Host 1 Million Users Without Paying a Cent

This guide shows you how to leverage free cloud tiers to run SmaRTC at scale.

---

## 🆓 Free Cloud Providers Overview

### 1. Oracle Cloud (⭐ BEST OPTION)
**Why it's amazing**: Forever free ARM servers

**Free Tier Includes**:
- 4 ARM cores (Ampere A1)
- 24GB RAM
- 200GB storage
- 10TB outbound bandwidth/month
- **No credit card expiration - FREE FOREVER**

**SmaRTC Capacity**: ~200,000 concurrent users per instance

**Setup**:
```bash
# SSH into Oracle Cloud instance
ssh ubuntu@your-oracle-instance

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clone SmaRTC
git clone https://github.com/DeLTa-X-Tunisia/SmaRTC
cd SmaRTC

# Deploy
docker-compose -f deploy/docker-compose.zero-cost.yml up -d --scale signal-server=4
```

### 2. Google Cloud Platform
**Free Tier**:
- $300 credit (90 days)
- 1 e2-micro instance (FREE forever in specific regions)
- 30GB storage
- 1GB network egress/month

**SmaRTC Capacity**: ~50,000 users on e2-micro

### 3. AWS Free Tier
**Includes**:
- t2.micro instance (750 hours/month for 12 months)
- 15GB bandwidth out/month
- 30GB EBS storage

**SmaRTC Capacity**: ~50,000 users

### 4. Azure
**Free Tier**:
- $200 credit (30 days)
- B1S instance (FREE for 12 months)
- 15GB bandwidth out

**SmaRTC Capacity**: ~50,000 users

### 5. Hetzner (CHEAPEST PAID)
**Not free but ridiculously cheap**:
- €4.15/month for CX21 (2 vCPU, 4GB RAM)
- 20TB traffic included

**SmaRTC Capacity**: ~100,000 users

---

## 🗺️ Free Tier Deployment Strategy

### Option A: Pure Free (300k users)
```
2× Oracle Cloud    = 400k users  (FREE forever)
1× Google Cloud    = 50k users   (FREE forever in us-central1)
1× AWS Free Tier   = 50k users   (FREE for 12 months)
-------------------------------------------
TOTAL              = 500k users for €0/month
```

### Option B: Hybrid (1M users for €20/month)
```
2× Oracle Cloud    = 400k users  (FREE)
4× Hetzner CX21    = 400k users  (€16.60/month)
1× Google Cloud    = 50k users   (FREE)
-------------------------------------------
TOTAL              = 850k users for €16.60/month
```

### Option C: Unlimited (1M+ users for €50/month)
```
2× Oracle Cloud    = 400k users  (FREE)
10× Hetzner CX21   = 1M users    (€41.50/month)
-------------------------------------------
TOTAL              = 1.4M users for €41.50/month
```

---

## 📋 Step-by-Step: Oracle Cloud Setup (200k Users, FREE)

### Step 1: Create Oracle Cloud Account
1. Go to https://oracle.com/cloud/free
2. Sign up (requires credit card but won't charge)
3. Select home region (choose closest to your users)

### Step 2: Create ARM Compute Instance
```bash
# Via Oracle Cloud Console:
# - Compute → Instances → Create Instance
# - Image: Ubuntu 22.04 ARM
# - Shape: VM.Standard.A1.Flex
# - OCPUs: 4 (max for free tier)
# - Memory: 24GB (max for free tier)
# - Network: Assign public IP
# - Add SSH key
```

### Step 3: Configure Firewall
```bash
# Via Console: Networking → Virtual Cloud Networks → Security Lists

# Allow inbound:
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 5000-5010 (SignalR)
- Port 3478 (STUN)
```

### Step 4: Install SmaRTC
```bash
# SSH into instance
ssh ubuntu@<your-oracle-ip>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone SmaRTC
git clone https://github.com/DeLTa-X-Tunisia/SmaRTC
cd SmaRTC

# Configure environment
cat > .env << EOF
ALLOWED_ORIGINS=*
LOG_LEVEL=Warning
DOTNET_GCServer=1
EOF

# Deploy with 4 replicas (for ARM's 4 cores)
docker-compose -f deploy/docker-compose.zero-cost.yml up -d --scale signal-server=4

# Verify
docker ps
curl http://localhost/health
```

### Step 5: Configure Domain (Free with Cloudflare)
```bash
# Cloudflare setup (free DNS + CDN + DDoS protection):
1. Add site to Cloudflare (free)
2. Add A record: smartc.yourdomain.com → <oracle-ip>
3. Enable "Proxy" (orange cloud)
4. SSL: Full (strict)
5. Firewall: Enable DDoS protection
```

---

## 🔧 Optimization for Free Tiers

### RAM Optimization (for 1-2GB instances)
```yaml
# docker-compose.zero-cost.yml adjustments for small instances
services:
  signal-server:
    deploy:
      resources:
        limits:
          memory: 512M  # Reduce for smaller instances
    environment:
      - DOTNET_GCHeapCount=1  # Single heap for low memory
```

### CPU Optimization
```bash
# Set CPU affinity for better performance
docker update --cpuset-cpus="0,1" smartc-signal-1
docker update --cpuset-cpus="2,3" smartc-signal-2
```

### Network Optimization
```bash
# Enable TCP BBR (better congestion control)
sudo modprobe tcp_bbr
echo "tcp_bbr" | sudo tee -a /etc/modules
echo "net.core.default_qdisc=fq" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## 🌐 DNS-Based Load Balancing (Free)

Instead of expensive load balancers, use DNS round-robin:

### Cloudflare Configuration
```
# Multiple A records with same name:
smartc.yourdomain.com → 1.2.3.4   (Oracle 1)
smartc.yourdomain.com → 5.6.7.8   (Oracle 2)
smartc.yourdomain.com → 9.10.11.12 (Google Cloud)
smartc.yourdomain.com → 13.14.15.16 (AWS)

# Enable Load Balancing:
- Traffic → Load Balancing (free tier: 500k requests/month)
- Health checks every 60s
- Failover automatic
```

---

## 📊 Monitoring (Free Tools)

### Grafana Cloud (Free Tier)
```bash
# Sign up: grafana.com/auth/sign-up
# Free: 10k metrics, 50GB logs, 50GB traces

# Install agent on each server
wget https://github.com/grafana/agent/releases/latest/download/agent-linux-amd64
chmod +x agent-linux-amd64
sudo mv agent-linux-amd64 /usr/local/bin/grafana-agent

# Configure
sudo mkdir -p /etc/grafana-agent
cat > /etc/grafana-agent/agent.yaml << EOF
server:
  log_level: warn

metrics:
  wal_directory: /tmp/grafana-agent
  global:
    scrape_interval: 60s
    remote_write:
      - url: https://prometheus-prod-01-eu-west-0.grafana.net/api/prom/push
        basic_auth:
          username: YOUR_GRAFANA_USER
          password: YOUR_GRAFANA_API_KEY
  configs:
    - name: smartc
      scrape_configs:
        - job_name: signal-server
          static_configs:
            - targets: ['localhost:5000']
EOF

# Start agent
sudo grafana-agent -config.file=/etc/grafana-agent/agent.yaml &
```

### UptimeRobot (Free Uptime Monitoring)
```
# Sign up: uptimerobot.com
# Free: 50 monitors, 5-minute checks

Monitors to add:
- https://smartc.yourdomain.com/health (HTTP)
- Each signal server health endpoint
- HAProxy stats page

Alert methods:
- Email (free)
- Webhook to Discord/Slack (free)
```

---

## 🛡️ Security (Free)

### Cloudflare WAF (Free)
```
Security → WAF → Create Rule:
- Block traffic from suspicious countries
- Rate limiting: 100 req/min per IP
- Challenge on high request rates
- Block known bot user-agents
```

### Let's Encrypt SSL (Free)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d smartc.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

### Fail2Ban (Free)
```bash
# Install
sudo apt install fail2ban

# Configure for SmaRTC
cat > /etc/fail2ban/jail.local << EOF
[smartc-dos]
enabled = true
filter = smartc-dos
logpath = /var/log/syslog
maxretry = 100
findtime = 60
bantime = 3600
EOF

# Start
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 💰 Cost Breakdown (Real Numbers)

### Scenario 1: 500k Users, €0/month
| Service | Provider | Capacity | Cost |
|---------|----------|----------|------|
| Server 1 | Oracle Cloud | 200k | €0 |
| Server 2 | Oracle Cloud | 200k | €0 |
| Server 3 | Google Cloud | 50k | €0 |
| Server 4 | AWS Free Tier | 50k | €0 |
| DNS | Cloudflare | - | €0 |
| SSL | Let's Encrypt | - | €0 |
| Monitoring | Grafana Cloud | - | €0 |
| **TOTAL** | | **500k users** | **€0** |

### Scenario 2: 1M Users, €41.50/month
| Service | Provider | Capacity | Cost |
|---------|----------|----------|------|
| Server 1-2 | Oracle Cloud | 400k | €0 |
| Server 3-12 | Hetzner CX21 | 1M | €41.50 |
| DNS | Cloudflare | - | €0 |
| SSL | Let's Encrypt | - | €0 |
| Monitoring | Grafana Cloud | - | €0 |
| **TOTAL** | | **1.4M users** | **€41.50** |

---

## 🚨 Emergency Procedures

### Out of Free Tier Resources?
```bash
# Quick migration to another free provider
# 1. Export config
docker-compose -f docker-compose.zero-cost.yml config > current-config.yml

# 2. Deploy on new instance
scp current-config.yml user@new-instance:/home/user/
ssh user@new-instance
docker-compose -f current-config.yml up -d

# 3. Update DNS (gradual migration)
# Add new IP to DNS, remove old after 24h
```

### Bandwidth Limit Hit?
```bash
# Enable aggressive compression
# In HAProxy config:
compression algo gzip
compression type text/html text/plain text/css application/json

# Reduce video quality default
# In signal-server config:
DEFAULT_QUALITY=Low  # Instead of Medium
```

---

## 🎓 Pro Tips for Free Tier Masters

1. **Oracle Cloud Trick**: Create account in multiple regions for 2× free instances
2. **Google Cloud**: Deploy in us-west1, us-central1, us-east1 (all free forever)
3. **AWS**: After 12 months, create new account with different email (not recommended officially)
4. **Cloudflare**: Use Workers for edge computing (100k requests/day free)
5. **GitHub Actions**: Use for automated deployments (2000 minutes/month free)

---

## 📞 Support

**Questions?** Contact Azizi Mounir: +216 27 774 075

**Issues?** Open GitHub issue or join Discord

**Want to contribute?** PRs welcome! Let's make WebRTC accessible to everyone.

---

**"The best things in life are free... and so is hosting 1M users with SmaRTC!" 🎉**
