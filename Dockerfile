FROM docker.io/node:22 AS git

RUN mkdir /app && chown -R node:node /app
WORKDIR /app
COPY .git .
RUN git config --global --add safe.directory /app && echo "{\"sha\": \"$(git rev-parse HEAD)\", \"version\": \"$(git describe --tags --abbrev=0)\", \"commitDate\": \"$(git log -1 --format=%cd --date=format:'%Y-%m-%dT%H:%M:%SZ')\", \"birthdate\": \"$(date +%Y-%m-%dT%H:%M:%SZ)\"}" > /app/serverversion

FROM docker.io/node:22-alpine
ENV TZ=Europe/Berlin
RUN apk add --no-cache git make python3
# to run ldap sync as script curl is needed
RUN apk add --no-cache curl

WORKDIR /schulcloud-server
COPY tsconfig.json tsconfig.build.json package.json package-lock.json .eslintrc.js .eslintignore nest-cli.json ./
COPY esbuild esbuild
COPY config config
COPY backup backup
COPY src src
COPY apps apps
COPY --from=git /app/serverversion apps/server/static-assets
COPY scripts/ldapSync.sh scripts/

RUN npm ci \
    && npm run build \
    # Remove dev dependencies. The modules transpiled by esbuild are removed too and must be added again after pruning.
    && mkdir temp \
    && cp -r node_modules/@keycloak/keycloak-admin-client-cjs temp \
    && cp -r node_modules/file-type-cjs temp \
    && npm prune --omit=dev \
    && cp -r temp/keycloak-admin-client-cjs node_modules/@keycloak \
    && cp -r temp/file-type-cjs node_modules \
    && rm -rf temp \
    && npm cache clean --force 

ENV NODE_ENV=production
ENV NO_COLOR="true"
CMD npm run start
