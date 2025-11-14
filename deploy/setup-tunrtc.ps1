# PowerShell script to set up the TunRTC environment

# Start Docker containers
docker-compose -f deploy/docker-compose.yml up -d

# Wait for services to be ready
Write-Host "Waiting for services to start..."
Start-Sleep -Seconds 10

# Apply database schema
# This requires psql to be in the PATH
# psql -h localhost -p 5432 -U user -d tunrtc -f database/schema.sql

Write-Host "TunRTC environment setup complete."
