#! /bin/bash

# automatically rolls out new versions on brandenburg, demo, open and test
# develop-Branch goes to test, Master-Branch goes to productive systems

# decrypt key 
openssl aes-256-cbc -K $encrypted_2709882c490b_key -iv $encrypted_2709882c490b_iv -in travis_rsa.enc -out travis_rsa -d

if [ "$TRAVIS_BRANCH" = "master" ]
then
  export DOCKERTAG=latest
else
  # replace special characters in branch name for docker tag
  export DOCKERTAG=$( echo $TRAVIS_BRANCH | tr -s "[:punct:]" "-" | tr -s "[:upper:]" "[:lower:]" )
fi

function buildandpush {
  # build containers
  docker build -t schulcloud/schulcloud-server:$DOCKERTAG -t schulcloud/schulcloud-server:$GIT_SHA .

  # Log in to the docker CLI
  echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

  # take those images and push them up to docker hub
  docker push schulcloud/schulcloud-server:$DOCKERTAG
  docker push schulcloud/schulcloud-server:$GIT_SHA
}

function deploytotest {
  # only develop should be on test
  # compose-file is distributed by the ansible

  # screw together config file for docker swarm
#  eval "echo \"$( cat compose-server-test.dummy )\"" > docker-compose-server.yml

  # copy config-file to server and execute mit travis_rsa
  chmod 600 travis_rsa
#  scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa docker-compose-server.yml linux@test.schul-cloud.org:~
#  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.schul-cloud.org /usr/bin/docker stack deploy -c /home/linux/docker-compose-server.yml test-schul-cloud
#  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.schul-cloud.org /usr/bin/docker service update --force test-schul-cloud_server
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-server:develop test-schul-cloud_server
}

function deploytoprods {
  # Deploys new masters on the instances brandenburg, open, demo
  # compose-files are distributed via Ansible, many different secrets, Mongo_URIs etc.

  # copy config-file to server and execute mit travis_rsa
  chmod 600 travis_rsa

  # brandenburg
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@open.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-server:latest brabu_server
  # open
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@open.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-server:latest open_server
  # thueringen
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@schulcloud-thueringen.de /usr/bin/docker service update --force --image schulcloud/schulcloud-server:latest thueringen_server
  # demo
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@demo.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-server:latest demo_server
}

function deploytostaging {
  # Deploys new masters on the instances brandenburg, open, demo
  # compose-files are distributed via Ansible, many different secrets, Mongo_URIs etc.

  # copy config-file to server and execute mit travis_rsa
  chmod 600 travis_rsa

  # staging
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@staging.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-server:$DOCKERTAG staging_server
}

function inform {
  curl -X POST -H 'Content-Type: application/json' --data '{"text":":rocket: Die Produktivsysteme können aktualisiert werden: Schul-Cloud Server!"}' $WEBHOOK_URL_CHAT
}


if [[ "$TRAVIS_BRANCH" = "master" && "$TRAVIS_PULL_REQUEST" = "false" ]]
then
  buildandpush
  inform
elif [[ "$TRAVIS_BRANCH" = "develop" ]]
then
  buildandpush	
  deploytotest
elif [[ $TRAVIS_BRANCH = release* || $TRAVIS_BRANCH = hotfix* ]]
then
  buildandpush
  deploytostaging
else
  echo "Nix wird deployt"
fi

exit 0
