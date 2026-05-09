@echo off
title Iglesia de Dios - Servidor Publico
cd /d "%~dp0"

echo ============================================
echo   IGLESIA DE DIOS - MISION EVANGELICA
echo   Subiendo pagina a internet...
echo ============================================
echo.

:: Inicia el servidor local
echo  [1/3] Iniciando servidor local...
start /B python -m http.server 8000 >nul 2>nul
timeout /t 1 /nobreak >nul

:: Muestra la IP local
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    set "IP_LOCAL=%%i"
    goto :MOSTRAR
)
: MOSTRAR
echo  [2/3] Servidor corriendo en:
echo         http://localhost:8000
echo         http://%IP_LOCAL%:8000
echo.

:: Abre ngrok
echo  [3/3] Abriendo tunel publico con ngrok...
echo.
echo  COMPARTI ESTA URL CON QUIEN QUIERAS:
echo.
start http://localhost:8000
ngrok http 8000 --log=stdout

:: Al cerrar ngrok se detiene todo
taskkill /f /im python.exe >nul 2>nul
echo.
echo  Servidor detenido.
pause
