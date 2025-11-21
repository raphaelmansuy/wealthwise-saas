FROM oven/bun:latest

WORKDIR /app

# Copy workspace configuration and package files
COPY package.json bun.lock turbo.json ./

# Copy web package files
COPY apps/web/package.json ./

# Install dependencies
RUN bun install

# Copy web source code
COPY apps/web .

# Build the application
RUN bun run build

# Set port environment variable
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the application using standalone server
CMD ["node", ".next/standalone/app/server.js"]
