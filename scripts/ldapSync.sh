#!/bin/sh
set -eu

default_time_out=39600
value_time_out=${SERVER_LDAP_SYNC_FULL_CRONJOB_TIMEOUT:-$default_time_out}

default_api_key="example"
value_api_key="${SYNC_API_KEY:-$default_api_key}"

# Start server in the background and redirect logs to file
nohup npm run nest:start > server.log 2>&1 &

# Show logs and wait for server to start up
echo "Server logs:"
tail -f server.log &

echo "Wait for server to start..."
until curl -s -w --retry 10 --retry-max-time 120 --retry-connrefused --retry-delay 10 http://localhost:3030/serverversion >/dev/null 2>&1; do
    sleep 1
    echo "asleep"
done

# Start sync
echo "Starting"
curl --max-time $value_time_out -H "X-API-Key: $value_api_key" "http://localhost:3030/api/v1/sync?target=ldap&forceFullSync=true" | python3 -m json.tool

# Process stops automatically and deletes logs with end of job pod
