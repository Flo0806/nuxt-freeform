# Stage 1: Build the static assets
FROM node:22-bookworm-slim AS builder

RUN apt-get update && apt-get upgrade -y
RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Stage 2: Serve the built assets with Nginx
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/.vitepress/dist .

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
