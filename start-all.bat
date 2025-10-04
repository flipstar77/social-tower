@echo off
echo ====================================
echo    TOWER STATS - COMPLETE STARTUP
echo ====================================
echo.

echo [1/3] Starting Web Server on Port 6079...
start "Tower Web Server" cmd /k "cd server && PORT=6079 node server.js"
timeout /t 3 /nobreak > nul

echo [2/3] Starting Discord Bot...
start "Tower Discord Bot" cmd /k "cd server && node bot-launcher.js"
timeout /t 3 /nobreak > nul

echo [3/3] Opening Dashboard in Browser...
timeout /t 5 /nobreak > nul
start http://localhost:6079

echo.
echo ====================================
echo       SYSTEM FULLY STARTED!
echo ====================================
echo.
echo Available at: http://localhost:6079
echo.
echo Discord Bot Commands:
echo   /submit - Submit tower run data
echo   /link   - Link Discord account
echo   /stats  - View your recent runs
echo   /help   - Show help information
echo.
echo Delete endpoint available at:
echo   DELETE http://localhost:6079/api/tower/runs/:id
echo.
echo Press any key to close this window...
pause > nul