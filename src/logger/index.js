const winston = require('winston');

const { format, transports, createLogger } = winston;

let logLevel = process.env.LOG_LEVEL;

if (!logLevel) {
	switch (process.env.NODE_ENV) {
		case 'default':
		case 'development':
			logLevel = 'debug';
			break;
		case 'test':
			logLevel = 'emerg';
			break;
		case 'production':
		default:
			logLevel = 'info';
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

let formater;
if (process.env.NODE_ENV === 'test') {
	formater = format.combine(
		format.prettyPrint({ depth: 1, colorize: true }),
	);
} else {
	formater = format.combine(
		format.timestamp(),
		addType,
		format.prettyPrint({ depth: 3, colorize: true }),
	);
}

const logger = createLogger({
	levels: winston.config.syslog.levels,
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
