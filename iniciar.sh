#!/usr/bin/env bash
set -e

# Cambiar al directorio del script
cd "$(dirname "$0")"

echo ""
echo "  ============================================"
echo "   SQL en la Hacienda - curso interactivo"
echo "  ============================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "  [X] No se encontro Node.js en el PATH."
  echo "  Instala Node.js LTS (v18+) desde https://nodejs.org"
  echo ""
  exit 1
fi

echo "  Abriendo en tu navegador en http://localhost:8899..."
echo "  (No cierres esta terminal mientras estudias)"
echo ""

# Intentar abrir el navegador en segundo plano
if command -v xdg-open >/dev/null 2>&1; then
  (sleep 3 && xdg-open "http://localhost:8899") &
elif command -v open >/dev/null 2>&1; then
  (sleep 3 && open "http://localhost:8899") &
fi

node server/server.js

echo ""
echo "  El servidor se detuvo."
