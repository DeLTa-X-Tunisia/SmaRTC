#!/usr/bin/env pwsh
# ========================================
# SmaRTC Zero-Cost Build & Test Script
# ========================================

Write-Host "🚀 SmaRTC Zero-Cost Build & Deployment" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Docker
try {
    docker --version | Out-Null
    Write-Host "✅ Docker installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check Docker Compose
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose not found." -ForegroundColor Red
    exit 1
}

# Check .NET SDK (optional, for local builds)
try {
    $dotnetVersion = dotnet --version
    Write-Host "✅ .NET SDK $dotnetVersion installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  .NET SDK not found (optional for Docker builds)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔨 Building optimized image..." -ForegroundColor Yellow

# Build optimized Docker image
Set-Location -Path "$PSScriptRoot\..\deploy"
docker-compose -f docker-compose.zero-cost.yml build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host ""

# Ask user how many replicas to deploy
$replicas = Read-Host "How many signal server replicas? (1-20, recommended: 3)"
if ([string]::IsNullOrWhiteSpace($replicas)) {
    $replicas = 3
}

Write-Host ""
Write-Host "🚀 Deploying $replicas instances..." -ForegroundColor Yellow

# Deploy services
docker-compose -f docker-compose.zero-cost.yml up -d --scale signal-server=$replicas

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host ""

# Wait for services to be ready
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Health check
Write-Host ""
Write-Host "🏥 Running health checks..." -ForegroundColor Yellow

try {
    $health = Invoke-RestMethod -Uri "http://localhost/health" -Method Get
    Write-Host "✅ Services are healthy!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Health check failed. Services might still be starting..." -ForegroundColor Yellow
}

# Display stats
Write-Host ""
Write-Host "📊 Container Statistics:" -ForegroundColor Cyan
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Cyan
Write-Host "   Health:      http://localhost/health" -ForegroundColor Gray
Write-Host "   Stats:       http://localhost/stats" -ForegroundColor Gray
Write-Host "   HAProxy:     http://localhost:8404/stats (admin/zerocost2024)" -ForegroundColor Gray
Write-Host "   Grafana:     http://localhost:3000 (admin/zerocost2024)" -ForegroundColor Gray
Write-Host "   Prometheus:  http://localhost:9090" -ForegroundColor Gray
Write-Host "   SignalR Hub: ws://localhost/signalhub" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Capacity Estimate:" -ForegroundColor Cyan
$capacity = $replicas * 100000
Write-Host "   $replicas instances × 100k connections = ~$capacity concurrent users" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Run load tests: artillery quick --count 1000 --num 10 ws://localhost/signalhub" -ForegroundColor Gray
Write-Host "   2. Monitor: docker stats" -ForegroundColor Gray
Write-Host "   3. Scale up: docker-compose -f docker-compose.zero-cost.yml up -d --scale signal-server=10" -ForegroundColor Gray
Write-Host "   4. Deploy to cloud: See docs/ZERO_COST_DEPLOYMENT.md" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - Performance: docs/ZERO_COST_BENCHMARKS.md" -ForegroundColor Gray
Write-Host "   - Deployment:  docs/ZERO_COST_DEPLOYMENT.md" -ForegroundColor Gray
Write-Host "   - Quick Start: docs/QUICK_START_ZERO_COST.md" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 SmaRTC Zero-Cost is ready! Built with ❤️ in Tunisia 🇹🇳" -ForegroundColor Green
