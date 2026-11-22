@echo off
chcp 65001 >nul
title SQL en la Hacienda
cd /d "%~dp0"

echo.
echo   ============================================
echo    SQL en la Hacienda - curso interactivo
echo   ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   [X] No se encontro Node.js en el PATH.
  echo.
  echo   Instala Node.js LTS desde https://nodejs.org
  echo   y vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b 1
)

echo   Abriendo el navegador en unos segundos...
echo   (No cierres esta ventana mientras estudias)
echo.

start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process 'http://127.0.0.1:8899'"

node server\server.js

echo.
echo   El servidor se detuvo.
pause
