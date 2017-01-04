#!/bin/bash

usage()
{
    cat << EOF
   	./backup.sh [opts] <export|import>

    OPTIONS:
        -h      Show this help.
        -p      Set path
        -c      Collection
        -U      Mongo Username
        -P      Mongo Password
        -D      Mongo Database
        -H      Mongo host string (ex. localhost:27017)
EOF
}


while getopts "hp:c:U:P:H:D:" opt; do
    case $opt in
     	h)
            usage
            exit
            ;;

        p)
            BACKUP_PATH_PREFIX="$OPTARG"
            ;;

        c)
            COLLECTION="$OPTARG"
            ;;

        U)
            USERNAME="$OPTARG"
            ;;

        P)
            PASSWORD="$OPTARG"
            ;;

		H)
            HOST="$OPTARG"
            ;;

        D)
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
    echo "Usage: ./backup.sh [opts] <export|import>"
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

if [ -z "$BACKUP_PATH_PREFIX" ]; then
	BACKUP_PATH_PREFIX=$(date +%Y_%m_%d_%H_%M_%S)
fi
BACKUP_PATH="backup/""$BACKUP_PATH_PREFIX"


ARGS=""
if [ -n "$USERNAME" ]; then
    ARGS="-u $USERNAME"
fi

if [ -n "$PASSWORD" ]; then
    ARGS="$ARGS -p $PASSWORD"
fi


# Make connection

CONN="$HOST/$DB"

if [ "$ACTION" = "export" ]; then

	if [  ! -z "$COLLECTION" ]; then
		DATABASE_COLLECTIONS=$COLLECTION
	else
		DATABASE_COLLECTIONS=$(mongo $CONN $ARGS --quiet --eval 'db.getCollectionNames().join(" ")')
	fi

	mkdir -p $BACKUP_PATH
	pushd $BACKUP_PATH 2>/dev/null

	for collection in $DATABASE_COLLECTIONS; do
		mongoexport --host $HOST $ARGS --db $DB --collection $collection --pretty --jsonArray --out $collection.json >/dev/null
	done

elif [ "$ACTION" = "import" ]; then

	pushd $BACKUP_PATH >/dev/null

	for path in *.json; do
	 	collection=${path%.json}
		echo "Importing $DB/$collection from $path"
		mongoimport --host $HOST $ARGS --db $DB --collection $collection $path --jsonArray --drop
	done

else

	echo "Usage: ./backup.sh [opts] <export|import>"

fi
