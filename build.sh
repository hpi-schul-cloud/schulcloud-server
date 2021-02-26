#!/bin/bash

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
echo GIT_FLOW_BRANCH:"$GIT_FLOW_BRANCH"
echo GIT_SHA="$GIT_SHA"

# export DOCKERTAG=latest
# export DOCKERTAG_SHA
# OPS-1664
if [ "$TRAVIS_BRANCH" = "master" ] || [ "$GIT_FLOW_BRANCH" = "release" ]
then
	export DOCKERTAG="${GIT_FLOW_BRANCH}"_v"$(jq -r '.version' package.json )"_latest
	export DOCKERTAG_SHA="${GIT_FLOW_BRANCH}"_v"$(jq -r '.version' package.json )"_"${GIT_SHA}"

elif [ "$GIT_FLOW_BRANCH" = "hotfix" ]
then
	# extract JIRA_TICKET_ID from TRAVIS_BRANCH
	JIRA_TICKET_ID=${TRAVIS_BRANCH/#hotfix\//}
	JIRA_TICKET_TEAM=${JIRA_TICKET_ID/%-*/} 
	JIRA_TICKET_ID=${JIRA_TICKET_ID/#$JIRA_TICKET_TEAM"-"/}
	JIRA_TICKET_ID=${JIRA_TICKET_ID/%-*/}
	JIRA_TICKET_ID="$JIRA_TICKET_TEAM"-"$JIRA_TICKET_ID"

	echo JIRA_TICKET_ID="$JIRA_TICKET_ID"
	
	# export DOCKERTAG=naming convention feature-<Jira id>-latest
	export DOCKERTAG="${GIT_FLOW_BRANCH}_${JIRA_TICKET_ID}_latest"
	export DOCKERTAG_SHA="${GIT_FLOW_BRANCH}_${JIRA_TICKET_ID}_${GIT_SHA}"
elif [ "$GIT_FLOW_BRANCH" = "feature" ]
then
	# extract JIRA_TICKET_ID from TRAVIS_BRANCH
	JIRA_TICKET_ID=${TRAVIS_BRANCH/#feature\//}
	JIRA_TICKET_TEAM=${JIRA_TICKET_ID/%-*/} 
	JIRA_TICKET_ID=${JIRA_TICKET_ID/#$JIRA_TICKET_TEAM"-"/}
	JIRA_TICKET_ID=${JIRA_TICKET_ID/%-*/}
	JIRA_TICKET_ID="$JIRA_TICKET_TEAM"-"$JIRA_TICKET_ID"

	echo JIRA_TICKET_ID="$JIRA_TICKET_ID"
	
	# export DOCKERTAG=naming convention feature-<Jira id>-latest
	export DOCKERTAG="${GIT_FLOW_BRANCH}_${JIRA_TICKET_ID}_latest"
	export DOCKERTAG_SHA="${GIT_FLOW_BRANCH}_${JIRA_TICKET_ID}_${GIT_SHA}"
elif [ "$GIT_FLOW_BRANCH" = "develop" ]
then
	# replace special characters in branch name for docker tag
	export DOCKERTAG="${GIT_FLOW_BRANCH}"_latest
	export DOCKERTAG_SHA="${GIT_FLOW_BRANCH}"_"${GIT_SHA}"
fi

echo DOCKERTAG="$DOCKERTAG"
echo DOCKERTAG_SHA="$DOCKERTAG_SHA"

function buildandpush {
	# build containers
	docker build -t schulcloud/schulcloud-server:"$DOCKERTAG" -t schulcloud/schulcloud-server:"$DOCKERTAG_SHA" .

	if [[ "$?" != "0" ]]
	then
		exit $?
	fi

	# Log in to the docker CLI
	echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

	# take those images and push them up to docker hub
	docker push schulcloud/schulcloud-server:"$DOCKERTAG"
	docker push schulcloud/schulcloud-server:"$DOCKERTAG_SHA"
}
# write version file
printf "%s\n%s\n%s" $TRAVIS_COMMIT $TRAVIS_BRANCH $TRAVIS_COMMIT_MESSAGE > ./version

echo "Event detected on matching branch . Building docker image..."
buildandpush

# trigger sc-app-ci to deploy release to staging
# deploy upcoming Release to staging 
# upcoming Release == Version xx.xx.0 or RegEx ^[0-9]+\.[0-9]+\.0$

# if [ "${GIT_FLOW_BRANCH}" = "release" ] && [[ "$(jq -r '.version' package.json )" =~ ^[0-9]+\.[0-9]+\.0$ ]]

VERSION="$(jq -r '.version' package.json )"
echo "deploy release to staging $TRAVIS_BRANCH"
echo "VERSION=$VERSION"
VERSION="26.0.0"
echo "VERSION"=$VERSION 
echo "NEXT_RELEASE"=$NEXT_RELEASE
echo "NEXT_RELEASE2"=$NEXT_RELEASE2
echo "NEXT_RELEASE3"=$NEXT_RELEASE3

curl -X POST https://api.github.com/repos/hpi-schul-cloud/sc-app-ci/dispatches \
-H 'Accept: application/vnd.github.everest-preview+json' \
-u $GITHUB_TOKEN \
--data '{"event_type": "Trigger_from_sc_server", "client_payload": { "GIT_BRANCH": "'"$TRAVIS_BRANCH"'", "TRIGGER_REPOSITORY": "sc-server", "VERSION": "'"$VERSION"'", "NEXT_RELEASE": "'"26.0.0"'" }}'
exit 0
