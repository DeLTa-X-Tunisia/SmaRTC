@echo off
REM Quick SDK Development Script for Windows
REM Usage: dev.bat [command]

if "%1"=="" goto help
if "%1"=="install" goto install
if "%1"=="build" goto build
if "%1"=="test" goto test
if "%1"=="dev" goto dev
if "%1"=="example" goto example
if "%1"=="clean" goto clean
goto help

:install
echo [1/2] Installing dependencies...
call npm install
if errorlevel 1 goto error
echo.
echo [2/2] Done!
echo.
echo Next: Run "dev.bat build" to build the SDK
goto end

:build
echo [1/2] Building SDK...
call npm run build
if errorlevel 1 goto error
echo.
echo [2/2] Done!
echo.
echo Build artifacts in: dist/
goto end

:test
echo [1/2] Running tests...
call npm test
if errorlevel 1 goto error
echo.
echo [2/2] Tests passed!
goto end

:dev
echo Starting development mode (watch)...
echo Press Ctrl+C to stop
call npm run dev
goto end

:example
echo [1/3] Checking if SDK is built...
if not exist "dist" (
    echo SDK not built! Building now...
    call npm run build
    if errorlevel 1 goto error
)
echo.
echo [2/3] Starting HTTP server on port 8080...
echo.
echo Example URL: http://localhost:8080/examples/simple-video-chat.html
echo.
echo Press Ctrl+C to stop server
echo.
start http://localhost:8080/examples/simple-video-chat.html
call npx http-server . -p 8080 -c-1
goto end

:clean
echo Cleaning build artifacts...
if exist "dist" rmdir /s /q dist
if exist "node_modules" rmdir /s /q node_modules
echo Done!
goto end

:help
echo.
echo SmaRTC SDK - Quick Development Script
echo =====================================
echo.
echo Commands:
echo   dev.bat install   - Install dependencies
echo   dev.bat build     - Build SDK (creates dist/)
echo   dev.bat test      - Run unit tests
echo   dev.bat dev       - Watch mode (auto-rebuild)
echo   dev.bat example   - Run example app in browser
echo   dev.bat clean     - Clean build artifacts
echo.
echo Quick Start:
echo   1. dev.bat install
echo   2. dev.bat build
echo   3. dev.bat example
echo.
goto end

:error
echo.
echo [ERROR] Command failed!
echo.
exit /b 1

:end
