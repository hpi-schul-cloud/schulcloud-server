const winston = require('winston');
const globalLogger = require('../../logger');

const getSyncLogger = (stream) => {
	const logger = winston.createLogger({
		transports: [
			new winston.transports.Stream({
				stream: globalLogger,
			}),
		],
	});
	if (stream) {
		logger.add(new winston.transports.Stream({
			stream,
		}));
	}
	return logger;
};

module.exports = getSyncLogger;
