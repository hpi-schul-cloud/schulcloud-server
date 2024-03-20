FROM docker.io/node:18 AS git

RUN mkdir /app && chown -R node:node /app
WORKDIR /app
COPY .git .
RUN git config --global --add safe.directory /app && echo "{\"sha\": \"$(git rev-parse HEAD)\", \"version\": \"$(git describe --tags --abbrev=0)\", \"commitDate\": \"$(git log -1 --format=%cd --date=format:'%Y-%m-%dT%H:%M:%SZ')\", \"birthdate\": \"$(date +%Y-%m-%dT%H:%M:%SZ)\"}" > /app/serverversion

FROM docker.io/node:18-alpine
ENV TZ=Europe/Berlin
RUN apk add --no-cache git make python3
# to run ldap sync as script curl is needed
RUN apk add --no-cache curl
WORKDIR /schulcloud-server
COPY tsconfig.json tsconfig.build.json package.json package-lock.json .eslintrc.js .eslintignore nest-cli.json ./
COPY esbuild ./esbuild
RUN npm ci && npm cache clean --force
COPY config /schulcloud-server/config
COPY backup /schulcloud-server/backup
COPY src /schulcloud-server/src
COPY apps /schulcloud-server/apps
COPY --from=git /app/serverversion /schulcloud-server/apps/server/static-assets
COPY scripts/ldapSync.sh /schulcloud-server/scripts/
RUN npm run build

ENV NODE_ENV=production
ENV NO_COLOR="true"
CMD npm run start
