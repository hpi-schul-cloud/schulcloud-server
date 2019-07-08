const winston = require('winston');

let logLevel;

switch (process.env.NODE_ENV) {
	case 'development':
		logLevel = 'debug';
		break;
	case 'test':
		logLevel = 'error';
		break;
	case 'production':
	default:
		logLevel = 'info';
}

const logger = winston.createLogger({
	levels: winston.config.syslog.levels,
	format: winston.format.combine(
		winston.format.timestamp(), // adds current timestamp
		winston.format.ms(),	// adds time since last log
		winston.format.simple(), // output as string. Use 'winston.format.prettyPrint()' for well formated json
	),
	transports: [
		new winston.transports.Console({
			level: logLevel,
			handleExceptions: true,
		}),
	],
	exitOnError: false,
});


module.exports = logger;
