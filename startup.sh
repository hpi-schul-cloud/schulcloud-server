#!/bin/bash

# Seeding the database
node ./backup.js -p setup/ import

npm start