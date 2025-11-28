# 📊 Grafana Dashboards - SmaRTC Zero-Cost

**4 dashboards professionnels pour monitoring temps réel** de ton système à 1M utilisateurs.

## 📁 Dashboards Disponibles

### 1. **System Overview** (`system-overview.json`)
**Vue d'ensemble opérationnelle** - Ton dashboard principal pour monitoring quotidien

**Métriques clés :**
- 📊 Total connexions actives
- 🔌 Sessions en cours
- 💾 Mémoire / CPU usage
- ⚡ Connexions en temps réel (timeseries)
- ⏱️ Latence P95
- 🎯 Score de santé système
- 📡 Load par serveur
- 📨 Messages/seconde
- 📋 Top sessions

**Usage :** Affichage permanent sur écran de monitoring, démos clients.

---

### 2. **Mesh Analytics** (`mesh-analytics.json`)
**Analyse réseau P2P** - Prouve que ta stratégie mesh fonctionne

**Métriques clés :**
- 🌐 Distribution des stratégies mesh (Full/Hybrid/Relay)
- 🔗 Nœuds relay actifs
- 👥 Moyenne peers par connexion
- 📊 Distribution taille de session (pie chart)
- 📈 Efficacité routing mesh (P2P vs Server)
- 🌡️ Heatmap latence
- ⚡ Performance relay nodes
- 💰 **Économies coûts** (% P2P vs serveur)
- 🏆 Top relay nodes

**Usage :** Démos techniques, validation économies zero-cost, optimisation routing.

---

### 3. **Performance Deep Dive** (`performance-deep-dive.json`)
**Analyse performance détaillée** - Pour optimisation et debugging

**Métriques clés :**
- 💾 Mémoire par instance (avec seuils)
- ⚡ CPU par core
- 🗑️ Garbage Collection activity (Gen 0/1/2)
- ⏱️ Latence P50/P90/P95/P99
- 📊 Efficacité connection pool
- 🔄 Connection churn rate
- ⚠️ Error rate
- 🌐 Network I/O (inbound/outbound)
- 🎯 Top resource consumers
- ⏰ Durée moyenne session

**Usage :** Performance tuning, identification bottlenecks, validation objectifs (<1KB/conn).

---

### 4. **Alerts & SLA** (`alerts-sla.json`)
**Surveillance alertes & SLA** - Garantie stabilité 99.9%

**Métriques clés :**
- 🎯 System uptime
- 📊 **SLA compliance (24h)**
- 🚨 Active alerts count
- ⚠️ Capacity status (%)
- 🔥 Firing alerts table
- 📈 Alert history timeline
- ⚡ High latency incidents (>200ms)
- 💥 Connection failures
- 🧊 Memory pressure
- 🔥 CPU throttling events
- 📉 Error rate trends
- ⚖️ Load balancer health
- 🎯 Instance health scores
- ⏱️ Slowest operations (P99)

**Annotations :**
- 🔵 Deployments/restarts
- 🔴 Alerts triggered

**Usage :** Monitoring production, validation SLA, gestion incidents.

---

## 🚀 Installation

### 1. Configuration Docker Compose

Ajoute ce volume dans `docker-compose.zero-cost.yml` :

```yaml
grafana:
  image: grafana/grafana:latest
  ports:
    - "3000:3000"
  volumes:
    - grafana-data:/var/lib/grafana
    - ./grafana-dashboards/dashboards.yml:/etc/grafana/provisioning/dashboards/dashboards.yml
    - ./grafana-dashboards:/etc/grafana/provisioning/dashboards/smartc:ro
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
    - GF_USERS_ALLOW_SIGN_UP=false
```

### 2. Démarrage

```powershell
cd deploy
docker-compose -f docker-compose.zero-cost.yml up -d
```

### 3. Accès Grafana

```
URL: http://localhost:3000
User: admin
Pass: admin (change sur premier login)
```

**Les 4 dashboards seront automatiquement provisionnés** dans le folder "SmaRTC".

---

## 📊 Variables de Dashboard

Tous les dashboards supportent :
- **`$instance`** : Filtre par instance signal-server (multi-select)
- **Auto-refresh** : 5-10 secondes
- **Time range** : Ajustable (1h, 6h, 24h, 7d)

---

## 🎯 Métriques Prometheus Requises

Les dashboards utilisent ces métriques custom (à exposer dans ton hub) :

```csharp
// ZeroCostWebRtcHub.cs - Ajoute ces compteurs
private static readonly Counter ConnectionsOpened = 
    Metrics.CreateCounter("smartc_connections_opened_total", "Total connections opened");

private static readonly Counter ConnectionsClosed = 
    Metrics.CreateCounter("smartc_connections_closed_total", "Total connections closed");

private static readonly Gauge ActiveConnections = 
    Metrics.CreateGauge("smartc_active_connections", "Current active connections");

private static readonly Gauge ActiveSessions = 
    Metrics.CreateGauge("smartc_active_sessions", "Current active sessions");

private static readonly Histogram RequestDuration = 
    Metrics.CreateHistogram("smartc_request_duration_seconds", "Request duration",
        new HistogramConfiguration { Buckets = Histogram.ExponentialBuckets(0.01, 2, 10) });

private static readonly Counter ErrorsTotal = 
    Metrics.CreateCounter("smartc_errors_total", "Total errors", new CounterConfiguration 
    { LabelNames = new[] { "error_type" } });

private static readonly Gauge ConnectionPoolSize = 
    Metrics.CreateGauge("smartc_connection_pool_size", "Connection pool total size");

private static readonly Gauge ConnectionPoolAvailable = 
    Metrics.CreateGauge("smartc_connection_pool_available", "Connection pool available");

// Mesh metrics
private static readonly Gauge MeshStrategyCount = 
    Metrics.CreateGauge("smartc_mesh_strategy", "Mesh strategy count", 
        new GaugeConfiguration { LabelNames = new[] { "strategy" } });

private static readonly Gauge ActiveRelayNodes = 
    Metrics.CreateGauge("smartc_active_relay_nodes", "Active relay nodes");

private static readonly Histogram MeshRoutingLatency = 
    Metrics.CreateHistogram("smartc_mesh_routing_latency_seconds", "Mesh routing latency");
```

**Intégration dans `Program.Optimized.cs` :**

```csharp
app.UseEndpoints(endpoints =>
{
    endpoints.MapHub<ZeroCostWebRtcHub>("/signal");
    endpoints.MapMetrics(); // ← Expose /metrics endpoint
});
```

---

## 🎨 Personnalisation

### Modifier un dashboard
1. Accède à Grafana UI
2. Édite le dashboard
3. Export JSON (Share → Export)
4. Remplace le fichier dans `deploy/grafana-dashboards/`

### Ajouter des alertes
Dans **Alerts & SLA** dashboard, configure les alerting rules :

```yaml
# deploy/prometheus.yml - Exemple alert rule
groups:
  - name: smartc_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(smartc_errors_total[5m]) > 10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(smartc_request_duration_seconds_bucket[5m])) > 0.2
        for: 5m
        labels:
          severity: warning
```

---

## 📸 Screenshots

_(À ajouter après déploiement)_

**System Overview :**
![System Overview](./screenshots/system-overview.png)

**Mesh Analytics :**
![Mesh Analytics](./screenshots/mesh-analytics.png)

**Performance Deep Dive :**
![Performance](./screenshots/performance-deep-dive.png)

**Alerts & SLA :**
![Alerts](./screenshots/alerts-sla.png)

---

## 🎯 Objectifs de Monitoring

| Métrique | Cible | Alerter si |
|----------|-------|------------|
| **Latence P95** | < 200ms | > 300ms |
| **Memory/conn** | < 1KB | > 2KB |
| **SLA** | 99.9% | < 99.5% |
| **Error Rate** | < 0.1% | > 1% |
| **CPU Usage** | < 50% | > 80% |
| **Conn. Capacity** | < 70% | > 85% |

---

## 🔧 Troubleshooting

### Dashboard vide ?
```powershell
# Vérifie que Prometheus scrape
curl http://localhost:9090/api/v1/targets

# Vérifie métriques exposées
curl http://localhost:5000/metrics
```

### Métriques manquantes ?
→ Ajoute les compteurs Prometheus dans `ZeroCostWebRtcHub.cs` (voir section ci-dessus).

### Grafana ne démarre pas ?
```powershell
docker logs smartc-grafana
# Vérifie permissions volumes
```

---

## 📚 Resources

- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)
- [SmaRTC Zero-Cost Architecture](../ZERO_COST_README.md)

---

**🎉 4 Dashboards production-ready pour tes démos et monitoring opérationnel !**
