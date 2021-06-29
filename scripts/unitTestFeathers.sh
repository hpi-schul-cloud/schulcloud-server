#!/bin/bash

# Envirments
ROCKET_CHAT_URI=http://localhost:5000
echo "ROCKET_CHAT_URI" $ROCKET_CHAT_URI

# Execute
curl https://raw.githubusercontent.com/hpi-schul-cloud/schulcloud-authorization-server/master/docker-compose-test.yml > docker-compose-oauthserver.yml
curl https://raw.githubusercontent.com/hpi-schul-cloud/schulcloud-authorization-server/master/.env.example > .env
docker-compose -f docker-compose-oauthserver.yml up -d

docker pull minio/minio
docker run -d -p 9090:9000 minio/minio server /data
