@echo off
title Progress Net - Obtener IP
color 0A

echo ====================================
echo   Progress Net - IP Local
echo ====================================
echo.

echo Buscando direcciones IP...
echo.

:: Obtener IP IPv4
ipconfig | findstr "IPv4" > temp_ip.txt

:: Mostrar resultados
echo.
echo TUS DIRECCIONES IP:
echo --------------------
type temp_ip.txt
echo --------------------
echo.

:: Extraer IP principal (generalmente la primera)
for /f "tokens=2 delims=:" %%a in ('type temp_ip.txt ^| findstr /n "192.168."') do (
    set MAIN_IP=%%a
    goto :found
)

:found
if defined MAIN_IP (
    echo.
    echo ====================================
    echo   IP PRINCIPAL ENCONTRADA:
    echo ====================================
    echo.
    echo    %MAIN_IP%
    echo.
    echo ====================================
    echo   LINK PARA COMPARTIR:
    echo ====================================
    echo.
    echo    http://%MAIN_IP%:3000
    echo.
    echo ====================================
    echo   ESCANEAR ESTE CODIGO QR:
    echo ====================================
    echo.
) else (
    echo.
    echo ====================================
    echo   NO SE ENCONTRÓ IP LOCAL
    echo ====================================
    echo.
    echo   Asegúrate de estar en la misma red
    echo   que el servidor esté corriendo
    echo.
)

:: Limpiar archivo temporal
del temp_ip.txt

echo.
echo Presiona cualquier tecla para salir...
pause > nul
