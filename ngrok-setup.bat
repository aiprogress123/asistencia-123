@echo off
title Progress Net - Ngrok Setup
color 0B

echo ====================================
echo   Progress Net - Ngrok Setup
echo ====================================
echo.

echo Verificando si ngrok esta instalado...
where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Ngrok no encontrado. Descargando...
    echo.
    echo Descargando ngrok para Windows...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-windows-amd64.zip' -OutFile 'ngrok.zip'}"
    
    echo Descomprimiendo...
    powershell -Command "& {Expand-Archive -Path 'ngrok.zip' -DestinationPath '.'}"
    
    echo Limpiando archivos temporales...
    del ngrok.zip
    
    echo Ngrok instalado exitosamente!
    echo.
)

echo.
echo ====================================
echo   Iniciando Progress Net
echo ====================================
echo.

echo Asegurate que Progress Net este corriendo en http://localhost:3000
echo.
pause

echo.
echo ====================================
echo   Creando tunel publico con Ngrok
echo ====================================
echo.

:: Iniciar ngrok para el puerto 3000
ngrok http 3000 --log=stdout

pause
