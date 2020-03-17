const winston = require('winston');

const { format, transports, createLogger } = winston;

let logLevel = process.env.LOG_LEVEL;

if (!logLevel) {
	switch (process.env.NODE_ENV) {
		case 'development':
			logLevel = 'debug';
			break;
		case 'test':
			logLevel = 'emerg';
			break;
		case 'default':
		case 'production':
		default:
			logLevel = 'error';
	}
}

const addType = format.printf((log) => {
	if (log.stack || log.level === 'error') {
		log.type = 'error';
	} else {
		log.type = 'log';
	}
	return log;
});

const colorize = process.env.NODE_ENV !== 'production';
let formater;
if (process.env.NODE_ENV === 'test') {
	formater = format.combine(
		format.prettyPrint({ depth: 1, colorize }),
	);
} else {
	formater = format.combine(
		format.errors({ stack: true }),
		format.timestamp(),
		addType,
		format.prettyPrint({ depth: 3, colorize }),
	);
}

const logger = createLogger({
	levels: winston.config.syslog.levels,
	level: logLevel,
	format: formater,
	transports: [
		new transports.Console({
			level: logLevel,
			handleExceptions: true,
		}),
	],
	exitOnError: false,
});


module.exports = logger;
