#!/bin/bash

set -e # fail with exit 1 on any error

echo $( bash pwd)

# Preconditions
mkdir -p .build
openssl aes-256-cbc -K "$encrypted_0ddd2445e49f_key" -iv "$encrypted_0ddd2445e49f_iv" -in travis_rsa.enc -out .build/travis_rsa -d

echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

# Envirments

# Execute
docker pull mongo:4.2
docker run -d -p 27017:27017 mongo:4.2
npm ci
npm i -g wait-on
wait-on tcp:27017 -t 60000
