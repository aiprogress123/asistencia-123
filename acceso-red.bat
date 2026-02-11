@echo off
echo Configurando acceso para otros dispositivos...
echo.

echo 1. Iniciando servidor...
start "Progress Server" cmd /k "cd /d %~dp0 && call C:\Program Files\nodejs\node.exe server.js"

echo 2. Buscando tu IP...
timeout /t 3 >nul
ipconfig | findstr "IPv4"

echo.
echo ACCESO DESDE OTROS DISPOSITIVOS:
echo - Conecta los dispositivos a la misma red WiFi
echo - Abre el navegador y usa: http://[TU_IP]:3000
echo - Ejemplo: http://192.168.1.100:3000
echo.
echo Servidor iniciado y listo para conexiones!
pause
