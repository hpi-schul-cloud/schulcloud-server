const winston = require('winston');

const systemLogLevel = process.env.SYSTEM_LOG_LEVEL || 'sendRequests';

const systemLogger = winston.createLogger({
	level: systemLogLevel,
	levels: {			// todo syslog levels ?
		requestError: 0,
		systemLogs: 1,
		request: 2,
		sendRequests: 3,
	},
	format: winston.format.combine(
		winston.format.colorize({
			colors: {
				requestError: 'red',
				systemLogs: 'green',
				request: 'yellow',
				sendRequests: 'blue',
			},
			message: true,
		}),
		winston.format.printf((log) => log.message),
	),
	transports: [
		new winston.transports.Console({
			name: 'systemLogger',
		}),
	],
});
const requestError = (req, userId = 'noUserId', error) => systemLogger.requestError({
	type: 'RequestError',
	userId,
	url: req.url,
	data: req.body,
	method: req.method,
	timestamp: new Date(),
	code: error.code,
});

module.exports = {
	requestError,
	// sendRequests: systemLogger.sendRequests,
	// requestInfo: request,
	systemInfo: systemLogger.systemLogs,
};
