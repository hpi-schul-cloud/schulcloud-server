#! /bin/bash

### das ist alt
#cd ~/schulcloud-server/
#git pull
#npm install
#forever restart src/index.js
#curl -s -X POST https://api.telegram.org/bot$BOT_ID/sendMessage -d text="$NODE_ENV Server - update done" -d chat_id=$CHAT_ID
### das war alt

# build containers
docker build -t schul-cloud/schulcloud-server:$TRAVIS_BRANCH -t schul-cloud/schulcloud-server:$GIT_SHA .

# take those images and push them up to docker hub
docker push schul-cloud/schulcloud-server:$TRAVIS_BRANCH
docker push schul-cloud/schulcloud-server:$GIT_SHA

# screw together config file for docker swarm
eval "echo \"$( cat compose-server-test.dummy )\"" > docker-compose-server.yml

# copy config-file to server and execute mit travis_rsa
scp -i travis_rsa docker-compose-server.yml linux@test.schul-cloud.org:~


exit 0


