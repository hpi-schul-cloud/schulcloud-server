#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const arg = require('arg');

const { log } = console;
const { env } = process;
const {
	BASE_PATH = 'backup/',
	MONGO_HOST = '127.0.0.1',
	MONGO_PORT = '27017',
	// URL defaults to HOST and PORT from above
	MONGO_URL,
	MONGO_DATABASE,
	MONGO_USERNAME,
	MONGO_PASSWORD,
	// some values are overridden by args
} = env;

/** *****************************************
 * ARGUMENT PARSING
 ****************************************** */

const args = arg(
	{
		// Types
		'--help': Boolean, // show the help
		'-h': '--help',

		'--path': String, // export path or directory to import from
		'-p': '--path',

		'--collection': [String], // collection(s) to import/export
		'-c': '--collection',

		'--username': String, // Mongo Username
		'-U': '--username',

		'--password': String, // Mongo Password
		'-P': '--password',

		'--database': String, // Mongo Database
		'-D': '--database',

		'--url': String, // Mongo Host String (ex. localhost:27017)
		'-H': '--url',

		'--pretty': Boolean,
		'-b': '--pretty',

		'--sort': String, // export sort object requires string parameter like "{ name: 1, id: 1 }"
		'-s': '--sort',
	},
	{
		permissive: true,
		argv: process.argv.slice(2),
	}
);

if (args['--help']) {
	log(`Usage: node backup.js [opts] <export|import>

OPTIONS:
	--help (-h)        Show this help.

	--path (-p)        export path or directory to import from
	--collection (-c)  collection(s) to import/export, can be used multiple times

	--username (-U)    Mongo Username
	--password (-P)    Mongo Password
	--database (-D)    Mongo Database
	--url (-H)         Mongo Host String (ex. localhost:27017)

	--pretty (-b)      Pretty Print (only on export)
`);
	process.exit(0);
}

/** *****************************************
 * CONFIG
 ****************************************** */

const getTimestamp = () => {
	const d = new Date();
	return `${d.getUTCFullYear()}_${`0${d.getUTCMonth() + 1}`.slice(-2)}_${`0${d.getUTCDate()}`.slice(
		-2
	)}_${`0${d.getUTCHours()}`.slice(-2)}_${`0${d.getUTCMinutes()}`.slice(-2)}_${`0${d.getUTCSeconds()}`.slice(-2)}`;
};

const CONFIG = {
	BASE_PATH,
	get BACKUP_PATH_IMPORT() {
		return path.join(this.BASE_PATH, args['--path'] || 'setup');
	},
	get BACKUP_PATH_EXPORT() {
		return path.join(this.BASE_PATH, args['--path'] || getTimestamp());
	},
	MONGO: {
		HOST: MONGO_HOST,
		PORT: MONGO_PORT,
		get URL() {
			return MONGO_URL || args['--url'] || `${this.HOST}:${this.PORT}`;
		},
		DATABASE: MONGO_DATABASE || args['--database'] || 'schulcloud',
		USERNAME: MONGO_USERNAME || args['--username'],
		PASSWORD: MONGO_PASSWORD || args['--password'],
		get CREDENTIALS_ARGS() {
			const cmdArgs = [];
			if (CONFIG.MONGO.USERNAME) {
				cmdArgs.push('-u', CONFIG.MONGO.USERNAME);
			}
			if (CONFIG.MONGO.PASSWORD) {
				cmdArgs.push('--path', CONFIG.MONGO.PASSWORD);
			}
			return cmdArgs;
		},
	},
};

/** *****************************************
 * HELPER
 ****************************************** */

const cleanJoin = (a = [], seperator = ' ') => a.filter(Boolean).join(seperator);

const asyncExec = (command) =>
	new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				return reject(error);
			}
			return resolve(stdout || stderr);
		});
	});

const readDir = (directoryPath) =>
	new Promise((resolve, reject) =>
		fs.readdir(directoryPath, (err, files) => {
			if (err) {
				return reject(err);
			}
			return resolve(files);
		})
	);

const getFirstCharFromFile = async (filePath, position = 0) => {
	// open file for reading, returns file descriptor
	const fd = fs.openSync(filePath, 'r');

	return new Promise((resolve, reject) => {
		fs.read(fd, Buffer.alloc(1), 0, 1, position, (err, bytesRead, buffer) => {
			if (err) {
				return reject(err);
			}
			return resolve(String(buffer));
		});
	});
};

const ensureDirectoryExistence = (filePath) => {
	const dirname = path.dirname(filePath);
	if (fs.existsSync(dirname)) {
		return;
	}
	ensureDirectoryExistence(dirname);
	fs.mkdirSync(dirname);
};

/** *****************************************
 * IMPORT
 ****************************************** */

const importCollection = async ({ collection, filePath, drop = true }) => {
	const cmdArgs = [
		'mongoimport',
		'--host',
		CONFIG.MONGO.URL,
		'--db',
		CONFIG.MONGO.DATABASE,
		...CONFIG.MONGO.CREDENTIALS_ARGS,
		'--collection',
		collection,
		filePath,
		(await getFirstCharFromFile(filePath)) === '[' ? '--jsonArray' : undefined,
		drop ? '--drop ' : undefined,
	];
	const output = await asyncExec(cleanJoin(cmdArgs));
	return output;
};

const importDirectory = async (directoryPath) => {
	const files = await readDir(directoryPath);
	const imports = files.map(async (file) => {
		const collection = file.split('.').slice(0, -1).join('.');
		const filePath = path.join(directoryPath, file);
		return importCollection({
			collection,
			filePath,
		}).then(log);
	});
	const outputs = await Promise.all(imports);
	return outputs.join('\n');
};

/** *****************************************
 * EXPORT
 ****************************************** */

const exportCollection = async ({ collection, filePath }) => {
	const cmdArgs = [
		'mongoexport',
		'--host',
		CONFIG.MONGO.URL,
		'--db',
		CONFIG.MONGO.DATABASE,
		...CONFIG.MONGO.CREDENTIALS_ARGS,
		'--collection',
		collection,
		'--out',
		filePath,
		args['--sort'] ? `--sort "${args['--sort']}"` : undefined,
		'--jsonArray',
		args['--pretty'] ? '--pretty' : undefined,
	];
	const res = await asyncExec(cleanJoin(cmdArgs));
	log(`Exported ${CONFIG.MONGO.DATABASE}/${collection} into ${filePath}`);
	return res;
};

const getCollectionsToExport = async () => {
	let collections = args['--collection'];
	if (!collections) {
		const cmdArgs = [
			'mongo',
			`${CONFIG.MONGO.URL}/${CONFIG.MONGO.DATABASE}`,
			...CONFIG.MONGO.CREDENTIALS_ARGS,
			'--quiet',
			'--eval',
			'"db.getCollectionNames().join(\\" \\")"',
		];
		log(cleanJoin(cmdArgs));
		const all = await asyncExec(cleanJoin(cmdArgs));
		collections = all.split(' ').map((a) => a.trim());
	}
	return collections;
};

const exportBackup = async (exportPath) => {
	ensureDirectoryExistence(exportPath);
	const collections = await getCollectionsToExport();
	const exports = collections.map(async (collection) => {
		const filePath = path.join(exportPath, `${collection}.json`);
		exportCollection({
			collection,
			filePath,
		});
	});
	return Promise.all(exports);
};

/** *****************************************
 * MAIN
 ****************************************** */

const main = async () => {
	if (args._.length === 0) {
		throw new Error('import/export argument is missing');
	} else if (args._.length > 1) {
		throw new Error('to many arguments');
	} else if (args._[0] === 'import') {
		await importDirectory(CONFIG.BACKUP_PATH_IMPORT);
	} else if (args._[0] === 'export') {
		await exportBackup(CONFIG.BACKUP_PATH_EXPORT);
	} else {
		throw new Error('invalid argument');
	}
};

main();
