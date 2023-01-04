FROM docker.io/node:16 as git

RUN mkdir /app && chown -R node:node /app
WORKDIR /app
COPY .git .
RUN git config --global --add safe.directory /app && echo "{\"sha\": \"$(git rev-parse HEAD)\", \"version\": \"$(git describe --tags --abbrev=0)\", \"commitDate\": \"$(git log -1 --format=%cd --date=format:'%Y-%m-%dT%H:%M:%SZ')\", \"birthdate\": \"$(date +%Y-%m-%dT%H:%M:%SZ)\"}" > /app/serverversion

FROM docker.io/node:16-alpine
ENV TZ=Europe/Berlin
RUN apk add --no-cache git make python3
WORKDIR /schulcloud-server
COPY tsconfig.json tsconfig.build.json package.json package-lock.json .eslintrc.js .eslintignore nest-cli.json ./
RUN npm ci && npm cache clean --force
COPY config /schulcloud-server/config
COPY backup /schulcloud-server/backup
COPY migrations /schulcloud-server/migrations
COPY src /schulcloud-server/src
COPY apps /schulcloud-server/apps
COPY --from=git /app/serverversion /schulcloud-server/apps/server/static-assets
RUN npm run build

ENV NODE_ENV=production
CMD npm run start
