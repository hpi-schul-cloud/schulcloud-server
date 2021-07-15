# if node version is changed, also adapt .nvmrc file
FROM docker.io/library/node:lts-alpine
ENV TZ=Europe/Berlin
RUN apk add --no-cache git make python
WORKDIR /schulcloud-server
COPY tsconfig.json tsconfig.build.json package.json package-lock.json ./
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build
CMD npm run start
