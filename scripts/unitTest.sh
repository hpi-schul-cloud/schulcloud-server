#!/bin/bash

set -e # fail with exit 1 on any error

echo $( bash pwd)

# Preconditions
mkdir -p .build
openssl aes-256-cbc -K "$encrypted_0ddd2445e49f_key" -iv "$encrypted_0ddd2445e49f_iv" -in travis_rsa.enc -out .build/travis_rsa -d

echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

# Envirments
ROCKET_CHAT_URI=http://localhost:5000
echo "ROCKET_CHAT_URI" $ROCKET_CHAT_URI

# Execute
curl https://raw.githubusercontent.com/hpi-schul-cloud/schulcloud-authorization-server/master/docker-compose-test.yml > docker-compose-oauthserver.yml
curl https://raw.githubusercontent.com/hpi-schul-cloud/schulcloud-authorization-server/master/.env.example > .env
docker-compose -f docker-compose-oauthserver.yml up -d
docker pull mongo:4.2
docker run -d -p 27017:27017 mongo:4.2
docker pull minio/minio
docker run -d -p 9090:9000 minio/minio server /data
npm ci
npm i -g wait-on
wait-on tcp:27017 -t 60000

npm run test
npm run coverage-codecov
