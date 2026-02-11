@echo off
echo Instalando dependencias...
call "C:\Program Files\nodejs\npm.cmd" install

echo Iniciando servidor...
call "C:\Program Files\nodejs\node.exe" server.js

pause
