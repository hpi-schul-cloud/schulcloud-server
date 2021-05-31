#! /bin/bash

set -e

# Preconditions
#sudo rm /usr/local/bin/docker-compose
#curl -L https://github.com/docker/compose/releases/download/1.27.4/docker-compose-`uname -s`-`uname -m` > docker-compose
#chmod +x docker-compose
#sudo mv docker-compose /usr/local/bin

# Envirements
export BRANCH_NAME=${TRAVIS_PULL_REQUEST_BRANCH:=$TRAVIS_BRANCH}

echo "BRANCH: $BRANCH_NAME"

urlBranch="https://raw.githubusercontent.com/hpi-schul-cloud/end-to-end-tests/$BRANCH_NAME/scripts/ci/end-to-end-tests.travis.sh"
urlDevelop="https://raw.githubusercontent.com/hpi-schul-cloud/end-to-end-tests/develop/scripts/ci/end-to-end-tests.travis.sh"
urlMaster="https://raw.githubusercontent.com/hpi-schul-cloud/end-to-end-tests/master/scripts/ci/end-to-end-tests.travis.sh"

# Execute
if curl --head --silent --fail $urlBranch 2> /dev/null;
then
  echo "select $BRANCH_NAME"
  #curl -fO "$urlBranch"
elif [[ $BRANCH_NAME = feature* ]];
then
  echo "select develop"
  curl -fO "$urlDevelop"
else
  echo "select master"
  curl -fO "$urlMaster"
fi

echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

ls -a
chmod 700 end-to-end-tests.travis.sh
bash end-to-end-tests.travis.sh

set +e
