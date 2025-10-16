FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies first (leveraging cached layers)
COPY package.json package-lock.json* ./
RUN npm install --production=false

# Copy source files and build
COPY tsconfig.json .
COPY src ./src
COPY README.md LICENSE .
RUN npm run build

# -------- Runtime image --------
FROM node:20-slim AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/README.md ./README.md
COPY --from=builder /app/LICENSE ./LICENSE

# Install production dependencies only
RUN npm install --production --omit=dev

# Provide default configuration (overridable via Smithery env settings)
ENV PORT=3000
ENV QR_OUTPUT_DIR=/app/qrcodes
ENV PUBLIC_BASE_URL=http://localhost:3000

# Create directory for generated QR codes
RUN mkdir -p /app/qrcodes

EXPOSE 3000

CMD ["node", "build/index.js"]

