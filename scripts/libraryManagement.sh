#!/bin/sh
set -eu

default_time_out=39600
value_time_out=${SERVER_LIBRARY_MANAGEMENT_CRONJOB_TIMEOUT:-$default_time_out}

npm run nest:start:h5p:library-management
