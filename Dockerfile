# if node version is changed, also adapt .nvmrc file 
FROM node:lts-alpine
WORKDIR /schulcloud-server
COPY . .
ENV TZ=Europe/Berlin
CMD ./startup.sh
