FROM docker.io/node:22-alpine AS builder

WORKDIR /app
RUN apk add --no-cache git
COPY .git ./.git

RUN git config --global --add safe.directory /app  \
    && echo "{\"sha\": \"$(git rev-parse HEAD)\", \"version\": \"$(git describe --tags --abbrev=0)\", \"commitDate\": \"$(git log -1 --format=%cd --date=format:'%Y-%m-%dT%H:%M:%SZ')\", \"birthdate\": \"$(date +%Y-%m-%dT%H:%M:%SZ)\"}" > /app/serverversion

COPY package.json package-lock.json tsconfig.json tsconfig.build.json ./
COPY esbuild ./esbuild
COPY src ./src
COPY config ./config
COPY backup ./backup
COPY apps ./apps
COPY scripts ./scripts

RUN npm ci && npm cache clean --force
RUN npm run build


FROM docker.io/node:22-alpine

ENV TZ=Europe/Berlin
RUN apk add --no-cache git make python3 curl

WORKDIR /schulcloud-server

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/esbuild ./esbuild
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config
COPY --from=builder /app/backup ./backup
COPY --from=builder /app/apps/server/static-assets ./apps/server/static-assets
COPY --from=builder /app/scripts/ldapSync.sh ./scripts/

# The postinstall script must be disabled, because esbuild is a dev dependency and not installed here.
RUN npm pkg delete scripts.postinstall \
    && npm ci --omit=dev \
    && npm cache clean --force

ENV NODE_ENV=production
ENV NO_COLOR="true"

CMD npm run start
