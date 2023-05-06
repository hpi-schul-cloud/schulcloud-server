#!/bin/sh
# Start server in the background and redirect logs to file
nohup npm run nest:start > server.log 2>&1 &

# Wait for server to start up and show logs
echo "Wait for server to start..."
echo "Server logs:"
tail -f server.log &

until curl -s -w --retry 360 --retry-connrefused --retry-delay 10 "%{http_code}\n" "http://localhost:3030/serverversion" | grep 200; do
    sleep 1
done

# Start sync
curl --max-time {{ SERVER_LDAP_SYNC_FULL_CRONJOB_TIMEOUT|default("39600", true) }} -H "X-API-Key: $SYNC_API_KEY" "http://{{ API_LDAP_SYNC_SVC|default("api-ldapsync-svc", true) }}:3030/api/v1/sync?target=ldap&forceFullSync=true" | python3 -m json.tool

# Stop server and cleanup
kill %1
rm server.log
