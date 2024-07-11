#!/bin/bash

function select_target() {
    declare -a targets=("https://main.nbc.dbildungscloud.dev" "https://bc-6854-basic-load-tests.nbc.dbildungscloud.dev")
    echo "Please select the target for the test:" >&2
    select target in "${targets[@]}"; do
        if [[ -n $target ]]; then
            break
        else
            echo "Invalid selection. Please try again." >&2
        fi
    done
}

function select_scenario() {
    # list files in the scenarios directory
    scenarios_dir="./scenarios"
    declare -a scenario_files=($(ls $scenarios_dir))

    echo "Please select a scenario file for the test:" >&2
    select scenario_file in "${scenario_files[@]}"; do
        if [[ -n $scenario_file ]]; then
            echo "You have selected: $scenario_file" >&2
            break
        else
            echo "Invalid selection. Please try again." >&2
        fi
    done

    scenario_name="${scenario_file%.*}"
}

function get_credentials() {
    if [ -z "$CARL_CORD_PASSWORD" ]; then
        echo "Password for Carl Cord is unknown. Provide it as an enviroment variable (CARL_CORD_PASSWORD) or enter it:"
        read CARL_CORD_PASSWORD
        export CARL_CORD_PASSWORD
    fi
}

function get_token() {
    response=$(curl -s -f -X 'POST' \
        "$target/api/v3/authentication/local" \
        -H 'accept: application/json' \
        -H 'Content-Type: application/json' \
        -d "{
        \"username\": \"lehrer@schul-cloud.org\",
        \"password\": \"$CARL_CORD_PASSWORD\"
        }")

    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to get token. Please check your credentials and target URL." >&2
        exit 1
    fi

    token=$(echo $response | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
}

function get_course_id() {
    response=$(curl -s -f -X 'GET' \
        "$target/api/v3/courses" \
        -H "Accept: application/json" \
        -H "Authorization: Bearer $token")
    
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to get course list. Please check your credentials and target URL." >&2
        exit 1
    fi

    course_id=$(echo $response | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
}

function create_board_title() {
    current_date=$(date +%Y-%m-%d_%H:%M)
    board_title="${current_date}_$1"
}

function create_board() {
    response=$(curl -s -f -X 'POST' \
        "$target/api/v3/boards" \
        -H 'accept: application/json' \
        -H 'Content-Type: application/json' \
        -H "Authorization: Bearer $token" \
        -d "{
            \"title\": \"$board_title\",
            \"parentId\": \"$course_id\",
            \"parentType\": \"course\",
            \"layout\": \"columns\"
        }")

    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to create a board." >&2
        exit 1
    fi

    board_id=$(echo $response | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' )
}

if [ -z "$1" ]; then
    select_target
else
    target=$1
fi
echo " "
echo "target: $target"


if [ -z "$2" ]; then
    select_scenario
    echo "scenario_name: $scenario_name"
else
    scenario_name="$2"
    scenario_name=${scenario_name//.yml/}
fi
echo "scenario_name: $scenario_name"

get_credentials

get_token
echo "token: ${token:0:50}..."
echo " "

get_course_id
echo "course_id: $course_id"
echo " "

create_board_title $scenario_name
echo "board_title: $board_title"

create_board
echo "board_id $board_id"

echo "board: $target/rooms/$board_id/board"
echo " "
echo "Running artillery test..."

npx artillery run --variables "{\"target\": \"$target\", \"token\": \"$token\", \"board_id\": \"$board_id\" }" "./scenarios/$scenario_name.yml" --output artilleryreport.json

npx artillery report --output=$board_title.html artilleryreport.json
