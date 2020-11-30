#!/bin/bash
export TRAVIS_BRANCH="feature/OPS-1559-Enhance_build_pipeline"
# automatically rolls out new versions on brandenburg, demo, open and test
# develop-Branch goes to test, Master-Branch goes to productive systems

# decrypt key
mkdir -p .build
openssl aes-256-cbc -K $encrypted_bce910623bb2_key -iv $encrypted_bce910623bb2_iv -in travis_rsa.enc -out .build/travis_rsa -d

#
# set -e : "... Exit immediately if a pipeline [...], which may consist of a single simple command [...],
# a list [...], or a compound command [...] returns a non-zero status. ..."
# [From: https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html]
#
# trap [action] [signal] : Trap calls catch on every EXIT with:
# - status code = 0: Successful run
# - status code != 0: Error
#
set -e
trap 'catch $? $LINENO' EXIT
catch() {
  if [ "$1" != "0" ]; then
    echo "An issue occured in line $2. Status code: $1"
  fi
}

# extract GIT_FLOW_BRANCH from TRAVIS_BRANCH
if [[ "$TRAVIS_BRANCH" == "master" ]]
then
	GIT_FLOW_BRANCH="master"
elif [[ "$TRAVIS_BRANCH" == "develop" ]]
then
	GIT_FLOW_BRANCH="develop"
elif [[ "$TRAVIS_BRANCH" =~ ^"release"* ]]
then
	GIT_FLOW_BRANCH="release"
elif [[ "$TRAVIS_BRANCH" =~ ^hotfix\/[A-Z]+-[0-9]+-[a-zA-Z_]+$ ]]
then
	GIT_FLOW_BRANCH="hotfix"
elif [[ "$TRAVIS_BRANCH" =~ ^feature\/[A-Z]+-[0-9]+-[a-zA-Z_]+$ ]]
then
	GIT_FLOW_BRANCH="feature"
else
	# Check for naming convention <branch>/<JIRA-Ticket ID>-<Jira_Summary>
	# OPS-1664
	echo -e "Event detected. However, branch name pattern does not match requirements to deploy. Expected <branch>/<JIRA-Ticket ID>-<Jira_Summary> but got $TRAVIS_BRANCH"
	exit 0
fi
echo GIT_FLOW_BRANCH:$GIT_FLOW_BRANCH

# export DOCKERTAG=latest
# OPS-1664
if [ "$TRAVIS_BRANCH" = "master" ] || [ "$GIT_FLOW_BRANCH" = "release" ]
then
	export DOCKERTAG=$GIT_FLOW_BRANCH-v$( jq -r '.version' package.json )-latest
elif [ "$GIT_FLOW_BRANCH" = "hotfix" ]
then
	# extract JIRA_TICKET_ID from TRAVIS_BRANCH
	JIRA_TICKET_ID=${TRAVIS_BRANCH/#hotfix\//}
	JIRA_TICKET_TEAM=${JIRA_TICKET_ID/%-*/} 
	JIRA_TICKET_ID=${JIRA_TICKET_ID/#$JIRA_TICKET_TEAM"-"/}
	JIRA_TICKET_ID=${JIRA_TICKET_ID/%-*/}
	JIRA_TICKET_ID=$( echo $JIRA_TICKET_TEAM"-"$JIRA_TICKET_ID | tr -s "[:upper:]" "[:lower:]" )	
	
	echo JIRA_TICKET_ID=$JIRA_TICKET_ID
	
	# export DOCKERTAG=naming convention feature-<Jira id>-latest
	export DOCKERTAG=$( echo $GIT_FLOW_BRANCH"-"$JIRA_TICKET_ID"-latest")
elif [ "$GIT_FLOW_BRANCH" = "feature" ]
then
	# extract JIRA_TICKET_ID from TRAVIS_BRANCH
	JIRA_TICKET_ID=${TRAVIS_BRANCH/#feature\//}
	JIRA_TICKET_TEAM=${JIRA_TICKET_ID/%-*/} 
	JIRA_TICKET_ID=${JIRA_TICKET_ID/#$JIRA_TICKET_TEAM"-"/}
	JIRA_TICKET_ID=${JIRA_TICKET_ID/%-*/}
	JIRA_TICKET_ID=$( echo $JIRA_TICKET_TEAM"-"$JIRA_TICKET_ID | tr -s "[:upper:]" "[:lower:]" )	
	
	echo JIRA_TICKET_ID=$JIRA_TICKET_ID
	
	# export DOCKERTAG=naming convention feature-<Jira id>-latest
	export DOCKERTAG=$( echo $GIT_FLOW_BRANCH"-"$JIRA_TICKET_ID"-latest")
else
	# replace special characters in branch name for docker tag
	export DOCKERTAG=$( echo $GIT_FLOW_BRANCH"-latest")
fi

echo DOCKERTAG=$DOCKERTAG

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

	## notwendig??
	# If branch is develop, add and push additional docker tags
	if [ "$TRAVIS_BRANCH" = "develop" ]
	then
		docker tag schulcloud/schulcloud-server:$DOCKERTAG schulcloud/schulcloud-server:$( echo $TRAVIS_BRANCH | tr -s "[:punct:]" "-" | tr -s "[:upper:]" "[:lower:]" )_v$( jq -r '.version' package.json )_$( date +"%y%m%d%H%M" )
		docker push schulcloud/schulcloud-server:$( echo $TRAVIS_BRANCH | tr -s "[:punct:]" "-" | tr -s "[:upper:]" "[:lower:]" )_v$( jq -r '.version' package.json )_$( date +"%y%m%d%H%M" )
	fi

	# If branch is feature, add and push additional docker tags
	if [[ "$TRAVIS_BRANCH" =~ ^"feature/"* ]]
	then
		docker push schulcloud/schulcloud-server:$DOCKERTAG
	fi
}

function deploytotest {
	# only develop should be on test
	# compose-file is distributed by the ansible

	# screw together config file for docker swarm
	# eval "echo \"$( cat compose-server-test.dummy )\"" > docker-compose-server.yml

	# copy config-file to server and execute mit travis_rsa
	chmod 600 .build/travis_rsa
	# scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa docker-compose-server.yml linux@test.schul-cloud.org:~
	# ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.hpi-schul-cloud.org /usr/bin/docker stack deploy -c /home/linux/docker-compose-server.yml test-schul-cloud
	# ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i travis_rsa linux@test.hpi-schul-cloud.org /usr/bin/docker service update --force test-schul-cloud_server
	ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i .build/travis_rsa travis@test.hpi-schul-cloud.org schulcloud/schulcloud-server:$DOCKERTAG test-schul-cloud_server
}

function deploytoprods {
	# Deploys new masters on the instances brandenburg, open, demo
	# compose-files are distributed via Ansible, many different secrets, Mongo_URIs etc.

	# copy config-file to server and execute mit travis_rsa
	chmod 600 .build/travis_rsa

	# brandenburg
	ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i .build/travis_rsa travis@open.hpi-schul-cloud.de schulcloud/schulcloud-server:latest brabu_server
	# open
	ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i .build/travis_rsa travis@open.hpi-schul-cloud.de schulcloud/schulcloud-server:latest open_server
	# thueringen
	ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i .build/travis_rsa travis@schulcloud-thueringen.de schulcloud/schulcloud-server:latest thueringen_server
	# demo
	ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i .build/travis_rsa travis@demo.hpi-schul-cloud.de schulcloud/schulcloud-server:latest demo_server
}

function deploytostaging {
	# Deploys new masters on the instances brandenburg, open, demo
	# compose-files are distributed via Ansible, many different secrets, Mongo_URIs etc.

	# copy config-file to server and execute mit travis_rsa
	chmod 600 .build/travis_rsa

	# staging
	ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i .build/travis_rsa travis@staging.hpi-schul-cloud.org schulcloud/schulcloud-server:$DOCKERTAG staging_server
}

function deploytohotfix {
	# Deploys new masters on the instances brandenburg, open, demo
	# compose-files are distributed via Ansible, many different secrets, Mongo_URIs etc.

	# copy config-file to server and execute mit travis_rsa
	chmod 600 .build/travis_rsa

	# staging
	ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i .build/travis_rsa travis@hotfix$1.hpi-schul-cloud.org schulcloud/schulcloud-server:$DOCKERTAG hotfix$1_server
}

function inform {
	if [[ "$TRAVIS_EVENT_TYPE" != "cron" ]]
	then
		curl -X POST -H 'Content-Type: application/json' --data '{"text":":rocket: Die Produktivsysteme können aktualisiert werden: HPI Schul-Cloud Server! Dockertag: '$DOCKERTAG'"}' $WEBHOOK_URL_CHAT
	fi
}

function inform_staging {
	if [[ "$TRAVIS_EVENT_TYPE" != "cron" ]]
	then
		curl -X POST -H 'Content-Type: application/json' --data '{"text":":boom: Das Staging-System wurde aktualisiert: HPI Schul-Cloud Server! https://api.staging.hpi-schul-cloud.org/version (Dockertag: '$DOCKERTAG')"}' $WEBHOOK_URL_CHAT
	fi
}

function inform_hotfix {
	if [[ "$TRAVIS_EVENT_TYPE" != "cron" ]]
	then
		curl -X POST -H 'Content-Type: application/json' --data '{"text":":boom: Das Hotfix-'$1'-System wurde aktualisiert: HPI Schul-Cloud Server! https://api.hotfix'$1'.hpi-schul-cloud.org/version (Dockertag: '$DOCKERTAG')"}' $WEBHOOK_URL_CHAT
	fi
}

# write version file
printf "%s\n%s\n%s" $TRAVIS_COMMIT $TRAVIS_BRANCH $TRAVIS_COMMIT_MESSAGE > ./version

if [[ "$TRAVIS_BRANCH" = "master" && "$TRAVIS_PULL_REQUEST" = "false" ]]
then
	# If an event occurs on branch master make sure it's
	# no pull request, call inform. Discard if event
	# is related to a pull request.
	echo "Event detected on branch master. Event is no Pull Request. Informing team."
	buildandpush
	inform
elif [ "$TRAVIS_BRANCH" = "develop" ]
then
	# If an event occurs on branch develop deploy to test
	echo "Event detected on branch develop. Building docker image..."
	buildandpush
	# ops-1109: Deployment now in sc-app-ci
	# deploytotest
elif [[ "$TRAVIS_BRANCH" =~ ^"feature/"* ]]
then
	# If an event occurs on branch feature deploy to test
	echo "Event detected on branch feature. Building docker image..."
	buildandpush
	# OPS-1559: Enhance build pipeline to use featurebranches
elif [[ $TRAVIS_BRANCH = release* ]]
then
	# If an event occurs on branch release* deploy to staging
	echo "Event detected on branch release*. Attempting to deploy to staging environment..."
	buildandpush
	deploytostaging
	inform_staging
elif [[ $TRAVIS_BRANCH = hotfix/* ]]
then
	# If an event occurs on branch hotfix* parse team id
	# and deploy to according hotfix environment
	TEAM="$(cut -d'/' -f2 <<< $TRAVIS_BRANCH)"
	if [[ "$TEAM" -gt 0 && "$TEAM" -lt 8 ]]; then
    	echo "Event detected on branch hotfix/$TEAM/... . Attempting to deploy to hotfix environment $TEAM..."
		buildandpush
		deploytohotfix $TEAM
		inform_hotfix $TEAM
	else
		echo "Event detected on branch hotfix*. However, branch name pattern does not match requirements to deploy. Expected hotfix/<team_number>/XX.XX.XX but got $TRAVIS_BRANCH"
	fi
else
	# If no condition is met, nothing will be deployed.
	echo "Event detected which does not meet any conditions. Deployment will be skipped."
fi

exit 0
