FROM docker.io/node:24-bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json tsconfig.build.json tsconfig.json nest-cli.json ./

RUN npm ci --ignore-scripts

COPY apps apps
COPY src src
COPY .git ./.git

RUN git config --global --add safe.directory /app  \
    && echo "{\"sha\": \"$(git rev-parse HEAD)\", \"version\": \"$(git describe --tags --abbrev=0)\", \"commitDate\": \"$(git log -1 --format=%cd --date=format:'%Y-%m-%dT%H:%M:%SZ')\", \"birthdate\": \"$(date +%Y-%m-%dT%H:%M:%SZ)\"}" > apps/server/static-assets/serverversion

RUN npm run build
RUN npm prune --production

FROM registry.opencode.de/oci-community/images/zendis/nodejs:24-minimal AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NO_COLOR="true"

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY backup backup
COPY config config

USER nonroot


CMD ["node", "dist/apps/server/apps/server.app"]
