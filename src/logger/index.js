const winston = require('winston');

/** version 2.0 implementation need update to version 3.0 */
const logger = new winston.Logger({
	transports: [
		new winston.transports.Console({
			handleExceptions: true,
			json: false,
		}),
	],
	exitOnError: false,
});

module.exports = logger;
