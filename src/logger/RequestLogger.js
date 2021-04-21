const winston = require('winston');

const { format, transports, createLogger } = winston;

const formater = format.printf((info) => {
	return `Request ${info.message}`;
});

const logger = createLogger({
	levels: winston.config.syslog.levels,
	level: 'alert',
	transports: [
		new transports.Console({
			level: 'alert',
			format: formater,
		}),
	],
	exitOnError: false,
});

module.exports = logger.alert;
