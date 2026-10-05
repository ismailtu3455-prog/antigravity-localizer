@echo off
chcp 65001 >nul
cls
echo ========================================================
echo   Antigravity Localizer - Deploy to GitHub
echo ========================================================
echo.
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0deploy.ps1"
echo.
pause
