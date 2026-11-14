@echo off
title Iniciar LogMagna
echo ========================================================
echo               INICIANDO LOGMAGNA
echo ========================================================
echo Backend API : http://localhost:3001
echo Frontend    : http://localhost:5173
echo ========================================================
echo.
cd /d "%~dp0"
node dev.js
pause
