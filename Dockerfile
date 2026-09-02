# ============================================================================
#  LLAMPAYEC - Imagen Docker
#  Construcción en 2 etapas:
#   - builder : instala dependencias (workspaces raíz + server) y compila el
#               frontend estático a dist/ con esbuild (npm run build).
#   - runtime : imagen final liviana (alpine) solo con dependencias de
#               producción del backend y el frontend ya compilado.
# ============================================================================

# ----------------------- 1. STAGE BUILDER -----------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Primero SOLO los manifiestos para aprovechar la caché de capas de Docker
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
RUN npm ci

# Luego el código fuente y se compila el frontend -> dist/
COPY . .
RUN npm run build

# ----------------------- 2. STAGE RUNTIME -----------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    LLAMPAYEC_DB_PATH=/app/data/llampayec.db

RUN mkdir -p /app/data

# Dependencias de producción del API (elimina devDependencies)
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev && npm cache clean --force

# Backend + frontend ya compilado
COPY --from=builder /app/server ./server
COPY --from=builder /app/dist ./dist

# Script de arranque (siembra la BD solo la primera vez)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

# Healthcheck: la aplicación es saludable si la API responde 200
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/products >/dev/null 2>&1 || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]