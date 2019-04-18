# fixes mixed tabs and spaces to tabs in source and test scripts
find src -name '*.js' ! -type d -exec bash -c 'expand -t 4 "$0" > /tmp/e && mv /tmp/e "$0"' {} \;
find test -name '*.js' ! -type d -exec bash -c 'expand -t 4 "$0" > /tmp/e && mv /tmp/e "$0"' {} \;

