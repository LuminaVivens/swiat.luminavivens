@echo off
title Lumina Vivens - DEV
cd /d "%~dp0"
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
echo.
echo [Lumina Vivens] Uruchamiam czysty Vite DEV...
echo.
npm run dev
pause
