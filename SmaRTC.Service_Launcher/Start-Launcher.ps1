# SmaRTC Service Launcher
# Launcher pour démarrer, arrêter et gérer les services SmaRTC

$LauncherPath = Join-Path $PSScriptRoot "bin\Release\net9.0-windows\SmaRTC.Service_Launcher.exe"

if (Test-Path $LauncherPath) {
    Start-Process $LauncherPath
} else {
    Write-Host "⚠️ Le launcher n'est pas compilé. Compilation en cours..." -ForegroundColor Yellow
    
    Push-Location $PSScriptRoot
    dotnet build -c Release
    Pop-Location
    
    if (Test-Path $LauncherPath) {
        Start-Process $LauncherPath
    } else {
        Write-Host "❌ Erreur de compilation. Vérifiez les logs." -ForegroundColor Red
    }
}
