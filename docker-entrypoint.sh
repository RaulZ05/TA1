#!/bin/sh
# ============================================================================
#  LLAMPAYEC - Punto de entrada del contenedor
# 1) Crea el directorio de datos (volumen) si no existe.
# 2) Si la base de datos no existe, la siembra con datos iniciales (seed).
# 3) Arranca el servidor Express en primer plano (exec => señales del docker
#    llegan directo al proceso, importante para `docker stop`).
# ============================================================================
set -e

echo ">>> Llampayec contenedor iniciando..."
echo ">>> Ruta BD : $LLAMPAYEC_DB_PATH"
echo ">>> Puerto  : $PORT"

DB_DIR="$(dirname "$LLAMPAYEC_DB_PATH")"
mkdir -p "$DB_DIR"

if [ ! -f "$LLAMPAYEC_DB_PATH" ]; then
  echo ">>> Base de datos no encontrada -> ejecutando seed (datos iniciales)..."
  node /app/server/seed.js
else
  echo ">>> Base de datos detectada -> arrancando con los datos existentes."
fi

exec node /app/server/index.js