#!/bin/bash

DEFAULT_DB="schulcloud"
DEFAULT_HOST="127.0.0.1:27017"
DEFAULT_PATH="backup/"

usage()
{
	cat << EOF

    Usage: ./backup.sh [opts] <export|import>

    OPTIONS:
        -h      Show this help.

        -p      Set Path
        -c      Set Collection

        -U      Mongo Username
        -P      Mongo Password
        -D      Mongo Database
        -H      Mongo Host String (ex. localhost:27017)

        -a      As JSON Array
        -b      Pretty Print

EOF
}


while getopts "hp:c:U:P:H:D:ab" opt; do
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
			DB_HOST="$OPTARG"
			;;

		D)
			DB="$OPTARG"
			;;

		a)
			JSON_ARRAY=1
			;;
		b)
			PRETTY_PRINT=1
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
	DB="$DEFAULT_DB"
fi

if [ -z "$DB_HOST" ]; then
	DB_HOST="$DEFAULT_HOST"
fi

if [ -z "$BACKUP_PATH_PREFIX" ]; then
	BACKUP_PATH_PREFIX=$(date +%Y_%m_%d_%H_%M_%S)
fi
BACKUP_PATH="$DEFAULT_PATH""$BACKUP_PATH_PREFIX"


CREDENTIALS=""
if [ -n "$USERNAME" ]; then
	CREDENTIALS="-u $USERNAME"
fi

if [ -n "$PASSWORD" ]; then
	CREDENTIALS="$CREDENTIALS -p $PASSWORD"
fi

STYLE=""
#if [ -n "$JSON_ARRAY" ]; then
#	STYLE="--jsonArray "
#fi

if [ -n "$PRETTY_PRINT" ]; then
	STYLE="$STYLE --pretty "
fi


# Make connection

CONN="$DB_HOST/$DB"

if [ "$ACTION" = "export" ]; then

	if [  ! -z "$COLLECTION" ]; then
		DATABASE_COLLECTIONS=$COLLECTION
	else
		DATABASE_COLLECTIONS=$(mongo $CONN $CREDENTIALS --quiet --eval 'db.getCollectionNames().join(" ")')
	fi

	mkdir -p $BACKUP_PATH
	pushd $BACKUP_PATH 2>/dev/null

	for collection in $DATABASE_COLLECTIONS; do
		echo "Exporting $DB/$collection into $collection.json"
		mongoexport --host $DB_HOST $CREDENTIALS --db $DB --collection $collection --out $collection.json $STYLE >/dev/null
	done

elif [ "$ACTION" = "import" ]; then

	pushd $BACKUP_PATH >/dev/null

	for path in *.json; do
		# auf array pru:fen und Parameter dazu
		STR=$( head -n1 $path )
		if [[ ${STR:0:1} == "[" ]] ; then
			ARRAY="--jsonArray"
		else
			ARRAY=""
		fi

		if [[ $path == *".secrets."* ]]
		then
			collection=${path%.secrets.json}
		else
			collection=${path%.json}
		fi
		echo "Importing $DB/$collection from $path"

		if [ "$PASSWORD" == "" ];
		then
			mongoimport --host $DB_HOST --db $DB --collection $collection $path $STYLE $ARRAY --drop
		else
			mongoimport --host $DB_HOST $CREDENTIALS --db $DB --collection $collection $path $STYLE $ARRAY --drop
		fi
	done

else
	echo "Usage: ./backup.sh [opts] <export|import>"
fi

exit 0
