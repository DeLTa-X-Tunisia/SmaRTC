# SmaRTC Flutter SDK - Installation & Setup Script
# This script helps you set up the Flutter SDK and example app

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  SmaRTC Flutter SDK Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Flutter is installed
Write-Host "Checking Flutter installation..." -ForegroundColor Yellow
$flutterVersion = flutter --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Flutter is not installed!" -ForegroundColor Red
    Write-Host "Please install Flutter from: https://flutter.dev/docs/get-started/install" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Flutter is installed" -ForegroundColor Green
Write-Host ""

# Check Flutter version
$flutterVersionLine = ($flutterVersion | Select-String "Flutter").ToString()
Write-Host "📦 $flutterVersionLine" -ForegroundColor Cyan
Write-Host ""

# Navigate to SDK directory
$sdkPath = Join-Path $PSScriptRoot ""
Set-Location $sdkPath

Write-Host "📂 SDK Path: $sdkPath" -ForegroundColor Cyan
Write-Host ""

# Install SDK dependencies
Write-Host "Installing SDK dependencies..." -ForegroundColor Yellow
flutter pub get
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install SDK dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ SDK dependencies installed" -ForegroundColor Green
Write-Host ""

# Run Flutter analyze
Write-Host "Running Flutter analyze..." -ForegroundColor Yellow
flutter analyze
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Some analysis warnings found (this is OK)" -ForegroundColor Yellow
}
else {
    Write-Host "✅ No critical errors found" -ForegroundColor Green
}
Write-Host ""

# Navigate to example directory
$examplePath = Join-Path $sdkPath "example"
if (Test-Path $examplePath) {
    Write-Host "Setting up example app..." -ForegroundColor Yellow
    Set-Location $examplePath
    
    # Install example dependencies
    flutter pub get
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install example dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Example app dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Check for connected devices
Write-Host "Checking for connected devices..." -ForegroundColor Yellow
$devices = flutter devices
Write-Host $devices
Write-Host ""

# Summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! 🎉" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start the backend:" -ForegroundColor White
Write-Host "   cd ../../deploy" -ForegroundColor Gray
Write-Host "   docker-compose up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Run the example app:" -ForegroundColor White
Write-Host "   cd example" -ForegroundColor Gray
Write-Host "   flutter run" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Or integrate in your app:" -ForegroundColor White
Write-Host "   See QUICKSTART.md for details" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   - README.md        : Full documentation" -ForegroundColor Gray
Write-Host "   - QUICKSTART.md    : Quick start guide" -ForegroundColor Gray
Write-Host "   - ARCHITECTURE.md  : Technical details" -ForegroundColor Gray
Write-Host "   - VALIDATION.md    : Testing checklist" -ForegroundColor Gray
Write-Host ""

Write-Host "Happy coding! 💙" -ForegroundColor Cyan
Write-Host ""

# Return to original directory
Set-Location $sdkPath
