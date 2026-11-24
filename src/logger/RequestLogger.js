const winston = require('winston');

const { maskSensitiveData } = require('./utils');

const { format, transports, createLogger } = winston;

const formater = format.combine(
	format.errors({ stack: true }),
	maskSensitiveData(),
	format.printf((info) => {
		return `Request ${info.message}`;
	})
);

const logger = createLogger({
	levels: winston.config.syslog.levels,
	level: 'info',
	transports: [
		new transports.Console({
			level: 'info',
			format: formater,
		}),
	],
	exitOnError: false,
});

module.exports = logger.alert;
