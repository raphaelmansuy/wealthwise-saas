FROM oven/bun:latest

WORKDIR /app

# Copy root package files for workspace setup
COPY package.json bun.lockb* ./
COPY turbo.json ./

# Copy package files for dependency resolution
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/

# Install dependencies first (better caching)
RUN bun install --frozen-lockfile

# Copy db package source files
COPY packages/db ./packages/db

# Copy API source code
COPY apps/api ./apps/api

# Build the application from the API directory
WORKDIR /app/apps/api
RUN bun run build

# Verify the build output exists
RUN ls -la dist/

# Go back to root for running
WORKDIR /app

# Expose port
EXPOSE 8080

# Health check for Docker
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the application in production mode using the built file
CMD ["bun", "run", "/app/apps/api/dist/index.js"]
