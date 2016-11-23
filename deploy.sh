cd ~/schulcloud-server/
git pull
npm install
forever restart src/index.js
curl -s -X POST https://api.telegram.org/bot$BOT_ID/sendMessage -d text="$NODE_ENV Server - update done" -d chat_id=$CHAT_ID
