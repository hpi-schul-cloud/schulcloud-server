# if node version is changed, also adapt .nvmrc file 
FROM node:lts-alpine

WORKDIR /schulcloud-server
# RSS-Cron starten
RUN apk update && apk upgrade && apk add --no-cache git make python tzdata curl
COPY ./package.json .
COPY ./package-lock.json .

RUN npm ci
#--only=production

COPY . .
RUN npm run nest:build
#COPY ./localtime /etc/localtime
ENV TZ=Europe/Berlin

#ENTRYPOINT crontab ./crontab && crond
RUN npm start

