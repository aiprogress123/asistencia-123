@echo off
echo Buscando tu IP local...
echo.
ipconfig | findstr "IPv4"
echo.
echo Usa esta IP en otros dispositivos: http://[TU_IP]:3000
echo.
pause
