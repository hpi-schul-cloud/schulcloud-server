FROM node:7

# Install dependency outside of the app volume
COPY package.json /opt/
RUN cd /opt && npm install
ENV NODE_PATH=/opt/node_modules

WORKDIR /app
RUN npm install -g nodemon
# Copy current directory to container
COPY . .

CMD ["npm", "start", "--"]
