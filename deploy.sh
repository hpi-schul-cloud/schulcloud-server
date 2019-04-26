#! /bin/bash

# rollt neue Versionen automaitsch auf brandenburg, demo, open und test aus
# develop-Branch geht auf Test, Master-Branch geht auf Produktivsysteme

#export TESTDEPLOY=$( cat testdeploy )

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
  # nur develop soll auf test
  # compose-File wird vom Ansible verteilt

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
  # deployt neue Master auf die Instanzen brandenburg, open, demo
  # compose-Files werden via Ansible verteilt, viele unterschiedliche Geheimnisse, Mongo_URIs etc

  # copy config-file to server and execute mit travis_rsa
  chmod 600 travis_rsa

  # brandenburg
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@brandenburg.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-server:latest brabu
  # open
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@open.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-server:latest open
  # demo
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@demo.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-server:latest demo
}

if [[ "$TRAVIS_BRANCH" = "master" && "$TRAVIS_PULL_REQUEST" = "false" ]]
then
  buildandpush
  deploytoprods
elif [ "$TRAVIS_BRANCH" = "develop" ]
then
  buildandpush	
  deploytotest
else
  echo "Nix wird deployt"
fi

exit 0
