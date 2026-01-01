# 🔒 Rate Limiting & Health Checks API

Enterprise-grade features for production reliability, abuse prevention, and monitoring.

## 📊 Health Check Endpoints

Health checks are **essential for production deployments**. They're used by Kubernetes, load balancers, and monitoring systems to determine instance health and route traffic accordingly.

### Endpoints

#### 1. **GET /api/health** — Overall Health
**Comprehensive status of all components**

Returns HTTP 200 if healthy, 503 if unhealthy.

```bash
curl http://localhost:8080/api/health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-28T10:30:45.123Z",
  "uptime": "02:15:30",
  "components": {
    "database": {
      "status": "healthy",
      "details": "Database connection successful",
      "responseTimeMs": 12
    },
    "cache": {
      "status": "healthy",
      "details": "Cache connection successful",
      "responseTimeMs": 5
    },
    "api": {
      "status": "healthy",
      "details": "API is responsive"
    }
  },
  "message": "All systems operational"
}
```

---

#### 2. **GET /api/health/live** — Liveness Probe
**Is the application running and responsive?**

Used by **Kubernetes liveness probes** to restart dead containers.

```bash
curl http://localhost:8080/api/health/live
```

Returns:
- `200` = Alive and responsive
- `503` = Dead (container will be restarted)

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-28T10:30:45.123Z",
  "uptime": "02:15:30",
  "components": {
    "database": {
      "status": "healthy",
      "details": "Can connect to database"
    }
  }
}
```

**Kubernetes Configuration:**
```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

---

#### 3. **GET /api/health/ready** — Readiness Probe
**Is the application ready to serve traffic?**

Used by **load balancers and Kubernetes readiness probes** to determine if traffic should be routed to this instance.

```bash
curl http://localhost:8080/api/health/ready
```

Returns:
- `200` = Ready to serve traffic
- `503` = Not ready (traffic will not be routed here)

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-28T10:30:45.123Z",
  "uptime": "00:00:05",
  "components": {
    "database": {
      "status": "healthy",
      "details": "Database connection successful",
      "responseTimeMs": 15
    },
    "cache": {
      "status": "healthy",
      "details": "Cache connection successful",
      "responseTimeMs": 8
    },
    "check_time": {
      "status": "healthy",
      "responseTimeMs": 25
    }
  },
  "message": "Application is ready to serve traffic"
}
```

**Kubernetes Configuration:**
```yaml
readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

---

#### 4. **GET /api/health/ping** — Simple Ping
**Minimal check with minimal overhead**

Ultra-lightweight endpoint for frequent checks (every 5 seconds).

```bash
curl http://localhost:8080/api/health/ping
```

**Response (200 OK):**
```json
{
  "status": "pong",
  "timestamp": "2025-11-28T10:30:45.123Z",
  "version": "2.0"
}
```

---

## 🛡️ Rate Limiting

Rate limiting protects your API from abuse and ensures fair resource allocation.

### How It Works

1. **Per-endpoint limits** — Each endpoint has configurable limit (requests per minute)
2. **Per-user limits** — Limits apply per user ID or IP
3. **Automatic reset** — 60-second sliding window
4. **Response headers** — Include rate limit info in all responses

### Default Limits

| Endpoint | Limit | Notes |
|----------|-------|-------|
| `/api/auth/login` | 5/min | Prevent brute force attacks |
| `/api/auth/register` | 3/min | Prevent spam registrations |
| `/api/session` | 30/min | Normal API usage |
| `/api/webrtc/ice` | 100/min | High-frequency ICE queries |
| `/api/admin/users` | 10/min | Admin operations |
| **All others** | 60/min | Default catch-all |

### Response Headers

Every API response includes rate limit headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1669625445
```

- `X-RateLimit-Limit` — Total requests allowed in window
- `X-RateLimit-Remaining` — Requests remaining in current window
- `X-RateLimit-Reset` — Unix timestamp when window resets

### Rate Limited Response (429)

When limit is exceeded:

```bash
curl http://localhost:8080/api/session
# After 30+ requests in the same minute
```

**Response (429 Too Many Requests):**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 42,
  "rateLimit": {
    "limit": 30,
    "remaining": 0,
    "resetTime": 1669625445
  }
}
```

### Bypassing Rate Limits

**Admin endpoints are excluded from rate limiting** via authentication scope.

### Configuration

Customize limits in `RateLimitService.cs`:

```csharp
private readonly Dictionary<string, int> _endpointLimits = new()
{
    { "/api/auth/login", 5 },           // Custom limit
    { "/api/custom-endpoint/*", 100 },  // Pattern matching
    { "default", 60 }                   // Fallback
};
```

### Client Best Practices

```csharp
// Check rate limit headers
var client = new HttpClient();
var response = await client.GetAsync("http://localhost:8080/api/session");
var remaining = response.Headers.GetValues("X-RateLimit-Remaining").First();
var resetTime = response.Headers.GetValues("X-RateLimit-Reset").First();

if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
{
    // Wait before retrying
    var retryAfter = response.Content.ReadAsAsync<dynamic>().Result.retryAfter;
    await Task.Delay(TimeSpan.FromSeconds((int)retryAfter));
}
```

---

## 🚀 Kubernetes Integration

Complete example for production deployment with health checks and rate limiting:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smartc-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: smartc-api
  template:
    metadata:
      labels:
        app: smartc-api
    spec:
      containers:
      - name: api
        image: smartc-api:2.0
        ports:
        - containerPort: 8080
        
        # Liveness probe (restart if dead)
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          failureThreshold: 3
        
        # Readiness probe (only route traffic when ready)
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 2
        
        # Startup probe (give app time to boot)
        startupProbe:
          httpGet:
            path: /api/health/ping
            port: 8080
          failureThreshold: 30
          periodSeconds: 1
        
        resources:
          requests:
            cpu: 250m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi

---
apiVersion: v1
kind: Service
metadata:
  name: smartc-api
spec:
  selector:
    app: smartc-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

---

## 📈 Monitoring

### Prometheus Metrics (Coming Soon)

```
smartc_request_total{endpoint="/api/session", status="200"} 1523
smartc_request_duration_seconds{endpoint="/api/session"} 0.045
smartc_ratelimit_exceeded_total{endpoint="/api/auth/login"} 42
smartc_health_check_duration_seconds{component="database"} 0.012
```

### Grafana Dashboard

Import dashboard ID: [Coming Soon]

### Custom Alerts

```yaml
- alert: HighErrorRate
  expr: rate(smartc_request_total{status=~"5.."}[5m]) > 0.05
  annotations:
    summary: "High error rate on {{ $labels.endpoint }}"

- alert: DatabaseDown
  expr: smartc_health_check_duration_seconds{component="database"} == 0
  annotations:
    summary: "Database health check failed"

- alert: RateLimitExceeded
  expr: rate(smartc_ratelimit_exceeded_total[1m]) > 10
  annotations:
    summary: "Rate limit exceeded {{ $value }} times/min"
```

---

## 🔐 Security Considerations

1. **Rate limiting prevents brute force attacks**
   - Login endpoint: 5 attempts/minute
   - Register endpoint: 3 attempts/minute

2. **Health checks should not expose sensitive data**
   - Check `/api/health` response for information leakage
   - Avoid internal details in error messages

3. **Disable health endpoints in restricted networks**
   - Health checks authenticate users
   - Can be gated behind authorization if needed

4. **Monitor rate limit abuse patterns**
   - Track clients exceeding limits
   - Implement IP-based blocking for heavy abuse

---

## 📚 References

- [Kubernetes Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
- [API Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

**SmaRTC Enterprise Features v2.0** — Production-ready reliability! 🚀
