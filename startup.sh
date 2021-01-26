#!/bin/bash

# Seeding the database
node ./backup.js -p setup/ --url $MONGO_HOST:27017 --database $MONGO_DATABASE import

npm start