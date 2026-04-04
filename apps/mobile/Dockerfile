# Stage 1: Build the Expo web export
FROM node:24-slim AS builder

WORKDIR /app

# Copy package files for layer caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Export as static web site
# npx expo export --platform web generates a static site in /app/dist/
RUN npx expo export --platform web

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the static export to Nginx's default serve directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx config for SPA routing
# All routes (e.g., /gallery, /photo/abc) must serve index.html
# because Expo Router handles routing client-side
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
