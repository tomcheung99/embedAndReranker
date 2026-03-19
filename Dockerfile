# ── Build Stage ──────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ── Production Stage ─────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# 不以 root 執行
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 只複製 production 所需檔案
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# 零 runtime 依賴，無需 npm install
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server/app.js"]
