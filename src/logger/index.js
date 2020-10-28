const winston = require('winston');

const { format, transports, createLogger } = winston;
const { LOG_LEVEL, ENVIRONMENTS } = require('../../config/globals');
const { Configuration } = require('@schul-cloud/commons');

const addType = format.printf((log) => {
	if (log.stack || log.level === 'error') {
		log.type = 'error';
	} else {
		log.type = 'log';
	}
	return log;
});

const colorize = (Configuration.get('NODE_ENV') !== "production");
let formater;
if (Configuration.get('NODE_ENV') === "test") {
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
	level: LOG_LEVEL,
	format: formater,
	transports: [
		new transports.Console({
			level: LOG_LEVEL,
			handleExceptions: true,
			// https://github.com/winstonjs/winston#handling-uncaught-promise-rejections-with-winston
			handleRejections: true,
		}),
	],
	exitOnError: false,
});

module.exports = logger;
