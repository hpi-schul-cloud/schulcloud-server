const winston = require('winston');

const { format, transports, createLogger } = winston;
const { LOG_LEVEL, NODE_ENV, ENVIRONMENTS } = require('../../config/globals');

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
		format.prettyPrint({ depth: 3, colorize }),
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
		}),
	],
	exitOnError: false,
});

module.exports = logger;
