# if node version is changed, also adapt .nvmrc file 
FROM node:lts-alpine

WORKDIR /schulcloud-server
# RSS-Cron starten
RUN apk update && apk upgrade && apk add --no-cache git make python tzdata curl
COPY ./package.json .
COPY ./package-lock.json .

RUN npm install 
#--only=production
RUN npm run build

COPY . .
#COPY ./localtime /etc/localtime
ENV TZ=Europe/Berlin

#ENTRYPOINT crontab ./crontab && crond
#CMD npm start
CMD ./startup.sh
