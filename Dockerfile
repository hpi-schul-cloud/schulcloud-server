# if node version is changed, also adapt .nvmrc file 
FROM node:8.15-alpine

WORKDIR /schulcloud-server
# RSS-Cron starten
RUN apk update && apk upgrade && apk add --no-cache git make python tzdata curl
COPY ./package.json .
COPY ./package-lock.json .

RUN npm install 
#--only=production

COPY . .
#COPY ./localtime /etc/localtime
ENV TZ=Europe/Berlin

#ENTRYPOINT crontab ./crontab && crond
#CMD npm start
CMD ./startup.sh
