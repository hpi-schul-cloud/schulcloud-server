/*
Loglevels:
	PRODUCTION: 'error'; // level 3
	TEST: 'emerg'; // level 0
	DEVELOPMENT & MIGRATION: 'debug'; // level 7
*/
const winston = require('winston');
const { Configuration } = require('@schul-cloud/commons');

const { format, transports, createLogger } = winston;
const { NODE_ENV, ENVIRONMENTS } = require('../../config/globals');

const addType = format.printf((log) => {
	if (log.stack || log.level === 'error') {
		log.type = 'error';
	} else {
		log.type = 'log';
	}
	return log;
});

const colorize = NODE_ENV !== ENVIRONMENTS.PRODUCTION;
let formater;
if (NODE_ENV === ENVIRONMENTS.TEST) {
	formater = format.combine(format.prettyPrint({ depth: 1, colorize }));
} else {
	formater = format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		addType,
		format.prettyPrint({ depth: 3, colorize })
	);
}

const logger = createLogger({
	levels: winston.config.syslog.levels,
	level: Configuration.get('LOG_LEVEL'),
	format: formater,
	transports: [
		new transports.Console({
			level: Configuration.get('LOG_LEVEL'),
			handleExceptions: true,
			// https://github.com/winstonjs/winston#handling-uncaught-promise-rejections-with-winston
			handleRejections: true,
		}),
	],
	exitOnError: false,
});

module.exports = logger;
