#!/usr/bin/env node

const arg = require('arg');
const { exec } = require('child_process');

const { log, error } = console;

const readArgs = () => {
	const args = arg(
		{
			'--help': Boolean,
			'-h': '--help',

			'--url': String,
			'-u': '--url',

			'--path': String,
			'-p': '--path',
		},
		{
			argv: process.argv.slice(2),
		}
	);

	if ('--help' in args) {
		log(`Usage: node generate-client.js [opts]
	OPTIONS:
		--help (-h)		Show this help.
		--path (-p)		Path to the newly created client's directory.
		--url (-u)		URL/path to the spec file in yml/json format.
	`);
		process.exit(0);
	}

	return args;
};

const extractArg = (args, shortArg, longArg) => {
	const index = args._.findIndex((a) => a === shortArg || a === longArg);
	if (index === -1) {
		throw new Error(`The parameter ${longArg} or  ${longArg} is required.`);
	}

	const value = args._[index + 1];

	return value;
};

const extractConfig = (args) => {
	const url = extractArg(args, '-u', '--url');
	const path = extractArg(args, '-p', '--path');

	const config = {
		/** url to load the open-api definition from */
		url,
		/** folder to save the open-api client */
		path,
	};

	log('Create config from arguments', config, args);

	return config;
};

const errorMessageContains = (includedString, error) =>
	error && error.message && typeof error.message === 'string' && error.message.includes(includedString);

const getOpenApiCommand = (configuration) => {
	const { url, path } = configuration;
	// TODO: check with openapi-generator version 7 -g typescript-nestjs
	const command = `openapi-generator-cli generate -i ${url} -g typescript-axios -o ${path} --additional-properties=supportsES6=true,withInterfaces=true --skip-validate-spec`;
	return command;
};

const asyncExec = (command) =>
	new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				return reject(error);
			}
			return resolve(stdout || stderr);
		});
	});

const generateClient = (config, cmd) => {
	log(`Try updating the openapi client in the folder ${config.path} from ${config.url} ...`);
	asyncExec(cmd)
		.then((stdout) => log(stdout))
		.catch((stderr) => {
			if (errorMessageContains('ConnectException', stderr)) {
				error(`Failed to connect to ${config.url}, is the server started at this url?`);
			} else error(stderr.message);
		});
};

const main = () => {
	const args = readArgs();
	const config = extractConfig(args);
	const cmd = getOpenApiCommand(config);
	generateClient(config, cmd);
};

main();
