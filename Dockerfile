FROM node:20-slim

# Install PostgreSQL client and build tools
RUN apt-get update && apt-get install -y \
    postgresql-client \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy all source files
COPY . .

# Build the app (Vite frontend + esbuild backend)
RUN npm run build

# Run database migrations
RUN npm run db:push || true

# Expose the port Railway uses
ENV PORT=3000
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
