#FROM node:8.12.0
FROM node:8.15-alpine

WORKDIR /schulcloud-server
COPY . .
# RSS-Cron starten
RUN crontab ./crontab && crond
RUN apk update && apk upgrade && apk add --no-cache git make python
RUN npm install

CMD npm start
