#!/bin/bash

# Progress Net - Obtener IP para Linux/Mac

echo "===================================="
echo "  Progress Net - IP Local"
echo "===================================="
echo ""

echo "Buscando direcciones IP..."
echo ""

# Obtener IPs de todas las interfaces
ips=$(hostname -I | tr ' ' '\n')

if [ -z "$ips" ]; then
    # Alternativa si hostname -I no funciona
    ips=$(ifconfig | grep -E "inet [0-9]" | awk '{print $2}' | cut -d: -f2)
fi

echo ""
echo "TUS DIRECCIONES IP:"
echo "--------------------"
echo "$ips"
echo "--------------------"
echo ""

# Encontrar la IP principal (generalmente 192.168.x.x)
main_ip=$(echo "$ips" | grep -E "192\.168\." | head -1)

if [ -n "$main_ip" ]; then
    echo ""
    echo "===================================="
    echo "  IP PRINCIPAL ENCONTRADA:"
    echo "===================================="
    echo ""
    echo "   $main_ip"
    echo ""
    echo "===================================="
    echo "  LINK PARA COMPARTIR:"
    echo "===================================="
    echo ""
    echo "   http://$main_ip:3000"
    echo ""
    echo "===================================="
    echo "  ESCANEAR ESTE CODIGO QR:"
    echo "===================================="
    echo ""
    
    # Generar código QR (si está instalado qrencode)
    if command -v qrencode &> /dev/null; then
        qrencode -t ANSI "http://$main_ip:3000"
    else
        echo "   Instala qrencode para generar QR:"
        echo "   sudo apt-get install qrencode"
    fi
else
    echo ""
    echo "===================================="
    echo "  NO SE ENCONTRÓ IP LOCAL"
    echo "===================================="
    echo ""
    echo "   Asegúrate de estar en la misma red"
    echo "   que el servidor esté corriendo"
    echo ""
fi

echo ""
echo "Presiona Ctrl+C para salir..."
# Mantener el script corriendo para poder ver el QR
trap 'echo ""; echo "Saliendo..."; exit 0' INT
