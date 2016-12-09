#!/bin/bash

usage()
{
    cat << EOF
   	./backup.sh <export|import> [opts]

    OPTIONS:
        -h      Show this help.
        -p      Set path
        -c      Collection
        -d      Database
        -H      Mongo host string (ex. localhost:27017)
EOF
}


while getopts "hp:c:H:d:" opt; do
    case $opt in
     	h)
            usage
            exit
            ;;

        p)
            BACKUP_PATH="$OPTARG"
            ;;

        c)
            COLLECTION="$OPTARG"
            ;;

		H)
            HOST="$OPTARG"
            ;;

        d)
            DB="$OPTARG"
            ;;

        \?)
            echo "Invalid option $opt"
            exit 1
            ;;
    esac
done

shift $((OPTIND-1))

if [ -z "$1" ]; then
    echo "Usage: ./backup.sh <export|import> [opts]"
    exit 1
fi


# Set action

ACTION="$1"


# Fill in default values

if [ -z "$DB" ]; then
    DB="schulcloud"
fi

if [ -z "$HOST" ]; then
    HOST="localhost:27017"
fi

if [ -z "$BACKUP_PATH" ]; then
    BACKUP_PATH="backup"
fi


# Make connection

CONN="$HOST/$DB"

if [ "$ACTION" = "export" ]; then

	if [  ! -z "$COLLECTION" ]; then
		DATABASE_COLLECTIONS=$COLLECTION
	else
		DATABASE_COLLECTIONS=$(mongo $CONN --quiet --eval 'db.getCollectionNames().join(" ")')
	fi

	mkdir -p $BACKUP_PATH
	pushd $BACKUP_PATH 2>/dev/null

	for collection in $DATABASE_COLLECTIONS; do
		mongoexport --host $HOST --db $DB --collection $collection --out $collection.json >/dev/null
	done

elif [ "$ACTION" = "import" ]; then

	pushd $BACKUP_PATH >/dev/null

	for path in *.json; do
	 	collection=${path%.json}
		echo "Importing $DB/$collection from $path"
		mongoimport --host $HOST --db $DB --collection $collection $path --drop
	done

else

	echo "Usage: ./backup.sh <export|import> [opts]"

fi
