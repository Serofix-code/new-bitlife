@echo off
setlocal
cd /d "%~dp0"
title Next Chapter Phone Server
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 server.py
  goto :end
)
where python >nul 2>nul
if %errorlevel%==0 (
  python server.py
  goto :end
)
echo.
echo Python 3 was not found.
echo Install Python from python.org, then double-click this file again.
echo.
pause
:end
endlocal
