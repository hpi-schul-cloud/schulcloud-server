#!/bin/bash
# Start server in the background and redirect logs to file
nohup npm run nest:start > server.log 2>&1 &

# Wait for server to start up
echo "Wait for server to start..."
until curl -s -w "%{http_code}\n" "http://localhost:3030/serverversion" | grep 200; do
    sleep 1
done

# Show server logs and start sync
echo "Server logs:"
tail -f server.log &

curl --retry 360 --retry-connrefused --retry-delay 10 --max-time {{ SERVER_LDAP_SYNC_FULL_CRONJOB_TIMEOUT|default("39600", true) }} -H "X-API-Key: $SYNC_API_KEY" "http://{{ API_LDAP_SYNC_SVC|default("api-ldapsync-svc", true) }}:3030/api/v1/sync?target=ldap&forceFullSync=true" | python3 -m json.tool

# Stop server and cleanup
kill %1
rm server.log
