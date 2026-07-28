#!/bin/bash
echo "Iniciando túnel SSH reverso hacia AWS..."
autossh -M 0 -N -f \
  -o "ServerAliveInterval=30" \
  -o "ServerAliveCountMax=3" \
  -o "ExitOnForwardFailure=yes" \
  -i /home/anderson/Descargas/key-verda.pem \
  -R 8081:10.219.80.211:80 \
  ubuntu@3.133.100.38

echo "¡Túnel enviado al fondo (background) exitosamente!"
echo "AWS ahora tiene acceso a la cámara en http://localhost:8081"
