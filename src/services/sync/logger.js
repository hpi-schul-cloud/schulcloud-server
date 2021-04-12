const winston = require('winston');
const { Writable } = require('stream');
const globalLogger = require('../../logger');

const getSyncLogger = (logStream) => {
	const logger = winston.createLogger({
		levels: winston.config.syslog.levels,
		level: globalLogger.level,
		transports: [
			new winston.transports.Stream({
				stream: globalLogger,
			}),
		],
	});
	if (logStream && logStream instanceof Writable) {
		logger.add(
			new winston.transports.Stream({
				stream: logStream,
			})
		);
	}
	return logger;
};

module.exports = getSyncLogger;
