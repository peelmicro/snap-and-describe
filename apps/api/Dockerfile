# Node.js 24 with native TypeScript support — no build step needed
FROM node:24-slim

WORKDIR /app

# Copy package files first for Docker layer caching
# If dependencies haven't changed, Docker reuses this layer
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 3000

# --experimental-transform-types: runs TypeScript natively and resolves .ts imports
CMD ["node", "--experimental-transform-types", "src/server.ts"]
