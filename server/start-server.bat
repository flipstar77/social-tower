@echo off
echo Starting Tower Stats Backend Server...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Navigate to server directory
cd /d "%~dp0"

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Make sure you're in the correct directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo ================================
echo  Tower Stats Backend Server
echo ================================
echo Server will start on: http://localhost:3001
echo Frontend will be served on: http://localhost:3001
echo API endpoints available at: http://localhost:3001/api/
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
npm start

pause