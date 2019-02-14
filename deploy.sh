#! /bin/bash

### das ist alt
#cd ~/schulcloud-server/
#git pull
#npm install
#forever restart src/index.js
#curl -s -X POST https://api.telegram.org/bot$BOT_ID/sendMessage -d text="$NODE_ENV Server - update done" -d chat_id=$CHAT_ID
### das war alt

# replace special characters in branch name for docker tag
export DOCKERTAG=$( echo $TRAVIS_BRANCH | tr -s "[:punct:]" "-" )

# build containers
docker build -t schulcloud/schulcloud-server:latest -t schulcloud/schulcloud-server:$DOCKERTAG -t schulcloud/schulcloud-server:$GIT_SHA .

# Log in to the docker CLI
echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

# take those images and push them up to docker hub
docker push schulcloud/schulcloud-server:$DOCKERTAG
docker push schulcloud/schulcloud-server:$GIT_SHA

# screw together config file for docker swarm
eval "echo \"$( cat compose-server-test.dummy )\"" > docker-compose-server.yml

# copy config-file to server and execute mit travis_rsa
chmod 600 travis_rsa
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa docker-compose-server.yml linux@test.schul-cloud.org:~
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.schul-cloud.org /usr/bin/docker stack deploy -c /home/linux/docker-compose-server.yml test-schul-cloud
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.schul-cloud.org /usr/bin/docker service update --force test-schul-cloud_server

exit 0


