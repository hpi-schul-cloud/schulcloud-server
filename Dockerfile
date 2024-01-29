FROM docker.io/node:18-alpine
ENV TZ=Europe/Berlin
RUN apk add --no-cache git make python3
# to run ldap sync as script curl is needed
RUN apk add --no-cache curl
# Install google-chrome-stable
RUN apk add --no-cache chromium
WORKDIR /schulcloud-server
COPY tsconfig.json tsconfig.build.json package.json package-lock.json .eslintrc.js .eslintignore nest-cli.json ./
COPY esbuild ./esbuild
RUN npm ci && npm cache clean --force
COPY config /schulcloud-server/config
COPY backup /schulcloud-server/backup
COPY migrations /schulcloud-server/migrations
COPY src /schulcloud-server/src
COPY apps /schulcloud-server/apps
COPY --from=git /app/serverversion /schulcloud-server/apps/server/static-assets
COPY scripts/ldapSync.sh /schulcloud-server/scripts/
RUN npm run build

ENV NODE_ENV=production
ENV NO_COLOR="true"
CMD npm run start
