# Stage 1: Build the static assets
FROM node:22-bookworm-slim AS builder

RUN apt-get update && apt-get upgrade -y
# Pinned: an unpinned pnpm silently follows major releases
RUN npm install -g pnpm@11.22.0

WORKDIR /app

COPY package.json ./

# esbuild needs its postinstall to fetch the binary. pnpm 11 fails on ignored
# build scripts instead of warning like pnpm 10 did, and the repo's allowBuilds
# lives in the root pnpm-workspace.yaml, which is outside this build context.
RUN printf 'allowBuilds:\n  esbuild: true\n' > pnpm-workspace.yaml
RUN pnpm install

COPY . .
RUN pnpm run build

# Stage 2: Serve the built assets with Nginx
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/.vitepress/dist .

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
