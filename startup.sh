#!/bin/bash

# Seeding the database
# cat ./backup/setup/storageprovider.json | sed -e "s/<AWS_ACCESS_KEY_ID>/$AWS_ACCESS_KEY_ID/g" | sed -e "s/<AWS_SECRET_ACCESS_KEY>/$AWS_SECRET_ACCESS_KEY/g" > ./backup/setup/storageprovider.json

export $AWS_SECRET_ACCESS_KEY=$(node ./scripts/encryptPassword.js --key $S3_KEY --token $AWS_SECRET_ACCESS_KEY)

sed -i "s/<AWS_ACCESS_KEY_ID>/$AWS_ACCESS_KEY_ID/g" ./backup/setup/storageprovider.json
sed -i "s/<AWS_SECRET_ACCESS_KEY>/$AWS_SECRET_ACCESS_KEY/g" ./backup/setup/storageprovider.json
node ./backup.js -p setup/ import

npm start
