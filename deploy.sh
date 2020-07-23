#!/bin/bash

# automatically rolls out new versions on brandenburg, demo, open and test
# develop-Branch goes to test, Master-Branch goes to productive systems

# decrypt key
openssl aes-256-cbc -K $encrypted_2709882c490b_key -iv $encrypted_2709882c490b_iv -in travis_rsa.enc -out travis_rsa -d

set -e
trap 'catch $? $LINENO' EXIT
catch() {
	echo "kabummm!!!"
	if [ "$1" != "0" ]; then
		echo "War wohl nicht so gut. Fehler $1, guckst du $2"
	fi
}

if [ "$TRAVIS_BRANCH" = "master" ]
then
	#export DOCKERTAG=latest
	export DOCKERTAG=master_v$( jq -r '.version' package.json )_$( date +"%y%m%d%H%M" )
else
	# replace special characters in branch name for docker tag
	export DOCKERTAG=$( echo $TRAVIS_BRANCH | tr -s "[:punct:]" "-" | tr -s "[:upper:]" "[:lower:]" )_v$( jq -r '.version' package.json )_$( date +"%y%m%d%H%M" )
fi

function buildandpush {
	# build containers
	docker build -t schulcloud/schulcloud-server:$DOCKERTAG -t schulcloud/schulcloud-server:$GIT_SHA .

	if [[ "$?" != "0" ]]
	then
		exit $?
	fi

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
	# eval "echo \"$( cat compose-server-test.dummy )\"" > docker-compose-server.yml

	# copy config-file to server and execute mit travis_rsa
	chmod 600 travis_rsa
	# scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa docker-compose-server.yml linux@test.schul-cloud.org:~
	# ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.schul-cloud.org /usr/bin/docker stack deploy -c /home/linux/docker-compose-server.yml test-schul-cloud
	# ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.schul-cloud.org /usr/bin/docker service update --force test-schul-cloud_server
	ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.schul-cloud.org /usr/bin/docker service update --force --image schulcloud/schulcloud-server:$DOCKERTAG test-schul-cloud_server
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

function deploytohotfix {
	# Deploys new masters on the instances brandenburg, open, demo
	# compose-files are distributed via Ansible, many different secrets, Mongo_URIs etc.

	# copy config-file to server and execute mit travis_rsa
	chmod 600 travis_rsa

	# staging
	ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@hotfix$1.schul-cloud.dev /usr/bin/docker service update --force --image schulcloud/schulcloud-server:$DOCKERTAG hotfix$1_server
}

function inform {
	if [[ "$TRAVIS_EVENT_TYPE" != "cron" ]]
	then
		curl -X POST -H 'Content-Type: application/json' --data '{"text":":rocket: Die Produktivsysteme können aktualisiert werden: Schul-Cloud Server! Dockertag: '$DOCKERTAG'"}' $WEBHOOK_URL_CHAT
	fi
}

function inform_staging {
	if [[ "$TRAVIS_EVENT_TYPE" != "cron" ]]
	then
		curl -X POST -H 'Content-Type: application/json' --data '{"text":":boom: Das Staging-System wurde aktualisiert: Schul-Cloud Server! https://api.staging.schul-cloud.org/version (Dockertag: '$DOCKERTAG')"}' $WEBHOOK_URL_CHAT
	fi
}

function inform_hotfix {
	if [[ "$TRAVIS_EVENT_TYPE" != "cron" ]]
	then
		curl -X POST -H 'Content-Type: application/json' --data '{"text":":boom: Das Hotfix-'$1'-System wurde aktualisiert: Schul-Cloud Server! https://api.hotfix'$1'.schul-cloud.org/version (Dockertag: '$DOCKERTAG')"}' $WEBHOOK_URL_CHAT
	fi
}

# write version file
printf "%s\n%s\n%s" $TRAVIS_COMMIT $TRAVIS_BRANCH $TRAVIS_COMMIT_MESSAGE > ./version

if [[ "$TRAVIS_BRANCH" = "master" && "$TRAVIS_PULL_REQUEST" = "false" ]]
then
	buildandpush
	inform
elif [[ "$TRAVIS_BRANCH" = "develop" ]]
then
	buildandpush
	deploytotest
elif [[ $TRAVIS_BRANCH = release* ]]
then
	buildandpush
	deploytostaging
	inform_staging
elif [[ $TRAVIS_BRANCH = hotfix* ]]
then
	TEAM="$(cut -d'/' -f2 <<< $TRAVIS_BRANCH)"
	if [[ "$TEAM" -gt 0 && "$TEAM" -lt 8 ]]; then
		buildandpush
		deploytohotfix $TEAM
		inform_hotfix $TEAM
	else
		echo "Hotfix branch name do not match requirements to deploy"
	fi

else
	echo "Nix wird deployt"
fi

exit 0
