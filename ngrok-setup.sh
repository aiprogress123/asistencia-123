#!/bin/bash

# Progress Net - Ngrok Setup para Linux/Mac

echo "===================================="
echo "  Progress Net - Ngrok Setup"
echo "===================================="
echo ""

echo "Verificando si ngrok está instalado..."
if ! command -v ngrok &> /dev/null; then
    echo ""
    echo "Ngrok no encontrado. Descargando..."
    echo ""
    
    # Detectar arquitectura
    ARCH=$(uname -m)
    if [[ "$ARCH" == "x86_64" ]]; then
        ARCH="amd64"
    elif [[ "$ARCH" == "arm64" ]]; then
        ARCH="arm64"
    elif [[ "$ARCH" == "armv7l" ]]; then
        ARCH="arm"
    fi
    
    # Detectar sistema operativo
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    
    echo "Descargando ngrok para $OS-$ARCH..."
    
    # Descargar ngrok
    if [[ "$OS" == "darwin" ]]; then
        curl -s https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-darwin-$ARCH.zip -o ngrok.zip
    else
        curl -s https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-$ARCH.zip -o ngrok.zip
    fi
    
    echo "Descomprimiendo..."
    unzip ngrok.zip
    
    echo "Haciendo ngrok ejecutable..."
    chmod +x ngrok
    
    echo "Limpiando archivos temporales..."
    rm ngrok.zip
    
    echo "Ngrok instalado exitosamente!"
    echo ""
fi

echo ""
echo "===================================="
echo "  Iniciando Progress Net"
echo "===================================="
echo ""

echo "Asegúrate que Progress Net esté corriendo en http://localhost:3000"
echo ""
read -p "Presiona Enter para continuar..."

echo ""
echo "===================================="
echo "  Creando túnel público con Ngrok"
echo "===================================="
echo ""

# Iniciar ngrok para el puerto 3000
ngrok http 3000
