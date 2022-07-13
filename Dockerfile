FROM docker.io/node:16 as git

RUN mkdir /app && chown -R node:node /app
WORKDIR /app
COPY .git .
RUN echo "{\"sha\": \"$(git rev-parse HEAD)\", \"version\": \"$(git describe --tags --abbrev=0)\", \"commitDate\": \"$(git log -1 --format=%cd --date=format:'%Y-%m-%dT%H:%M:%SZ')\", \"birthdate\": \"$(date +%Y-%m-%dT%H:%M:%SZ)\"}" > /app/version

FROM docker.io/node:16-alpine
ENV TZ=Europe/Berlin
RUN apk add --no-cache git make python3
WORKDIR /schulcloud-server
COPY tsconfig.json tsconfig.build.json package.json package-lock.json .eslintrc.js .eslintignore nest-cli.json ./
RUN npm ci && npm cache clean --force
COPY src /schulcloud-server/src
COPY apps /schulcloud-server/apps
COPY config /schulcloud-server/config
COPY backup /schulcloud-server/backup
COPY migrations /schulcloud-server/migrations
COPY static-assets /schulcloud-server/static-assets
COPY --from=git /app/version /schulcloud-server/static-assets
RUN npm run build
CMD npm run start
