FROM node:8.12.0

WORKDIR /schulcloud-server
COPY . .
RUN npm install

CMD npm start