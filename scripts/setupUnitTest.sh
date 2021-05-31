#!/bin/bash

set -e # fail with exit 1 on any error

echo $( bash pwd)

mkdir -p .build
openssl aes-256-cbc -K "$encrypted_bce910623bb2_key" -iv "$encrypted_bce910623bb2_iv" -in travis_rsa.enc -out .build/travis_rsa -d

echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

curl https://raw.githubusercontent.com/hpi-schul-cloud/schulcloud-authorization-server/master/docker-compose-test.yml > docker-compose-oauthserver.yml
curl https://raw.githubusercontent.com/hpi-schul-cloud/schulcloud-authorization-server/master/.env.example > .env
sudo docker-compose -f docker-compose-oauthserver.yml up -d
sudo docker pull mongo:4.2
sudo docker run -d -p 27017:27017 mongo:4.2
sudo docker pull minio/minio
sudo docker run -d -p 9090:9000 minio/minio server /data
npm ci
npm i -g wait-on
wait-on tcp:27017 -t 60000
