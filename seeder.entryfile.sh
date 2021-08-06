#!/bin/bash

seed_database()
{
    ./backup.sh -p setup/ import
    return $?
}

while true; do { echo -e 'HTTP/1.1 200 OK\r\n'; \
seed_database; } | nc -l 8080; done
