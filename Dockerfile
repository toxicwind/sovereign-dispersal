FROM oven/bun:1.2-slim AS base
WORKDIR /app

COPY package.json tsconfig.json ./
RUN bun install --frozen-lockfile

COPY src ./src
COPY scripts ./scripts
RUN bun build src/index.ts --outdir dist --target bun

FROM oven/bun:1.2-slim
WORKDIR /app
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./
USER bun
CMD ["bun", "dist/index.js"]
