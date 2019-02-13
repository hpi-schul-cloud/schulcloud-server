#! /bin/sh

crontab /schulcloud-server/crontab && crond -b
npm start
