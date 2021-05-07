#!/bin/sh

# crontab ./crontab && crond
npm run migration-sync
npm run start:nest:prod
