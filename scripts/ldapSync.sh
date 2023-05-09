#!/bin/sh
set -eu

default_time_out=39600
value_time_out=${SERVER_LDAP_SYNC_FULL_CRONJOB_TIMEOUT:-$default_time_out}

default_api_key="example"
value_api_key="${SYNC_API_KEY:-$default_api_key}"

# Start server in the background and redirect logs to file
nohup npm run nest:start > server.log 2>&1 &

# Wait for server to start up and show logs
echo "Wait for server to start..."
echo "Server logs:"
tail -f server.log &

until curl -s -w --retry 360 --retry-connrefused --retry-delay 10 http://localhost:3030/serverversion >/dev/null 2>&1; do
    sleep 1
    echo "asleep"
done

echo "Starting"
# Start sync
curl --max-time $value_time_out -H "X-API-Key: $value_api_key" "http://localhost:3030/api/v1/sync?target=ldap&forceFullSync=true" | python3 -m json.tool

# Stop server and cleanup
# kill %1
# rm server.log
