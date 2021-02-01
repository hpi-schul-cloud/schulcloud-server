# if node version is changed, also adapt .nvmrc file 
FROM node:lts-buster

WORKDIR /schulcloud-server
# RSS-Cron starten
RUN \
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add - && \
echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.4 main" >> /etc/apt/sources.list.d/mongodb-org-4.4.list && \
apt-get update -y && \ 
apt-get install -y git make python tzdata curl mongodb-org-shell mongodb-org-tools

COPY ./package.json .
COPY ./package-lock.json .

RUN npm ci

COPY . .
RUN npm run build

ENV TZ=Europe/Berlin

CMD ["/bin/sh", "startup.sh"]