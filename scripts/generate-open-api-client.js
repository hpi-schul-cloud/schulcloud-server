#!/usr/bin/env node

const arg = require('arg');
const { exec } = require('child_process');

const { log, error } = console;

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

const config = {
	/** url to load the open-api definition from */
	url: args._[1],
	/** folder to save the open-api client */
	path: args._[3],
};

log('Create config from arguments', config, args);

const errorMessageContains = (includedString, error) =>
	error && error.message && typeof error.message === 'string' && error.message.includes(includedString);

const getOpenApiCommand = (configuration) => {
	const { url, path } = configuration;
	const command = `openapi-generator-cli generate -i ${url} -g typescript-axios -o ${path} --additional-properties=npmName=restClient,supportsES6=true,withInterfaces=true --skip-validate-spec`;
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

const generateClient = () => {
	const cmd = getOpenApiCommand(config);
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
	generateClient();
};

main();
