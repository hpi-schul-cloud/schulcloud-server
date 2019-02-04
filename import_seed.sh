#! /bin/bash

#; import the mongos from ./backup/setup/


for JSON in ./backup/setup/*json
do
  STR=$( head -n1 $JSON )
  if [[ ${STR:0:1} == "[" ]] ; then 
    mongoimport --host=127.0.0.1 --port=27017 --db=schulcloud --jsonArray --file=$JSON
  elif [[ ${STR:0:1} == "{" ]] ; then 
    mongoimport --host=127.0.0.1 --port=27017 --db=schulcloud --file=$JSON
  else 
    echo "Das ist ein Mongo mit ganz miesen Startbedingungen"
  fi
done

exit 0
