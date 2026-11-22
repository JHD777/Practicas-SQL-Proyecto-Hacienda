@echo off
chcp 65001 >nul
title Borrar la base de datos de practica
cd /d "%~dp0"

echo.
echo   Esto elimina SOLO la base de datos "hacienda_practica".
echo   No toca ninguna otra base de datos ni el resto del proyecto.
echo.
set /p resp="   Seguro? (s/n): "
if /i not "%resp%"=="s" goto :fin

where psql >nul 2>nul
if errorlevel 1 (
  echo.
  echo   [X] No se encontro psql en el PATH.
  echo   Busca la carpeta bin de PostgreSQL, por ejemplo:
  echo   "C:\Program Files\PostgreSQL\18\bin"
  echo.
  pause
  exit /b 1
)

psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS hacienda_practica;"

:fin
echo.
pause
