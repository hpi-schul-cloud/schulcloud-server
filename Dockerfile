#FROM node:8.12.0
FROM node:8.15-alpine

WORKDIR /schulcloud-server
# RSS-Cron starten
RUN apk update && apk upgrade && apk add --no-cache git make python
COPY ./package.json .
RUN npm install 
#--only=production
COPY . .
COPY ./localtime /etc/localtime

#ENTRYPOINT crontab ./crontab && crond
CMD npm start
