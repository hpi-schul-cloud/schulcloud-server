#! /bin/bash

set -e

# Preconditions
dockerComposeUrl=https://github.com/docker/compose/releases/download/1.27.4/docker-compose-`uname -s`-`uname -m`
echo "load $dockerComposeUrl"
sudo rm /usr/local/bin/docker-compose
curl -L $dockerComposeUrl > docker-compose
chmod +x docker-compose
sudo mv docker-compose /usr/local/bin

# Envirements
export BRANCH_NAME=${TRAVIS_PULL_REQUEST_BRANCH:=$TRAVIS_BRANCH}

echo "BRANCH: $BRANCH_NAME"
fileName="end-to-end-tests.travis.sh"
urlBranch="https://raw.githubusercontent.com/hpi-schul-cloud/end-to-end-tests/$BRANCH_NAME/scripts/ci/$fileName"
urlDevelop="https://raw.githubusercontent.com/hpi-schul-cloud/end-to-end-tests/develop/scripts/ci/$fileName"
urlMaster="https://raw.githubusercontent.com/hpi-schul-cloud/end-to-end-tests/master/scripts/ci/$fileName"

# Execute
if curl --head --silent --fail $urlBranch 2> /dev/null;
then
  echo "select $BRANCH_NAME"
  echo "load $urlBranch" 
  curl -f -O -s -S "$urlBranch"
elif [[ $BRANCH_NAME = feature* ]];
then
  echo "select develop"
  echo "load $urlDevelop" 
  curl -f -O -s -S "$urlDevelop"
else
  echo "select master"
  echo "load $urlMaster" 
  curl -f -O -s -S "$urlMaster"
fi

echo "$MY_DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

chmod 700 $fileName
echo "------------------ loaded $fileName -------------------"
cat $fileName
echo "-------------------------------------------------------"
bash $fileName

set +e
