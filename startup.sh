#!/bin/sh

# crontab ./crontab && crond
npm run setup
npm run migration-sync
npm start
