FROM docker.io/node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.json tsconfig.build.json nest-cli.json ./
COPY apps apps
COPY config config
COPY esbuild esbuild
COPY src src

RUN apk add --no-cache git
COPY .git ./.git
RUN git config --global --add safe.directory /app  \
    && echo "{\"sha\": \"$(git rev-parse HEAD)\", \"version\": \"$(git describe --tags --abbrev=0)\", \"commitDate\": \"$(git log -1 --format=%cd --date=format:'%Y-%m-%dT%H:%M:%SZ')\", \"birthdate\": \"$(date +%Y-%m-%dT%H:%M:%SZ)\"}" > apps/server/static-assets/serverversion

RUN npm ci && npm run build


FROM docker.io/node:22-alpine

ENV TZ=Europe/Berlin
RUN apk add --no-cache \
    python3 \
    curl

WORKDIR /schulcloud-server

COPY package.json package-lock.json ./
COPY backup backup
COPY config config
COPY scripts/ldapSync.sh scripts/
COPY src src

COPY --from=builder /app/dist dist

# The postinstall script must be disabled, because esbuild is a dev dependency and not installed here.
RUN npm pkg delete scripts.postinstall \
    && npm ci --omit=dev \
    && npm cache clean --force

# The modules transpiled by esbuild need to be copied manually from the build stage.
COPY --from=builder /app/node_modules/@keycloak/keycloak-admin-client-cjs node_modules/@keycloak/keycloak-admin-client-cjs

ENV NODE_ENV=production
ENV NO_COLOR="true"

CMD ["npm", "run", "nest:start:prod"]
