const winston = require('winston');
const util = require('util');
const { Configuration } = require('@schul-cloud/commons');
const { SYSTEM_LOG_LEVEL } = require('../../config/globals');

const systemLogLevel = SYSTEM_LOG_LEVEL;
const colorizeMessage = Configuration.get('NODE_ENV') !== 'production';

const systemLogger = winston.createLogger({
	level: systemLogLevel,
	levels: {
		// todo syslog levels ?
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
			message: colorizeMessage,
		}),
		winston.format.printf((log) => log.message)
	),
	transports: [
		new winston.transports.Console({
			name: 'systemLogger',
			handleExceptions: true,
		}),
	],
	exitOnError: false,
});

const requestError = (req, userId = 'noUserId', error) =>
	systemLogger.requestError(
		util.inspect(
			{
				type: 'errorData',
				traceId: error.traceId,
				userId,
				url: req.originalUrl,
				data: req.body,
				method: req.method,
				timestamp: new Date(),
				code: error.code,
			},
			{
				depth: 5,
				compact: false,
				breakLength: 120,
			}
		)
	);

module.exports = {
	requestError,
	// sendRequests: systemLogger.sendRequests,
	// requestInfo: request,
	systemInfo: systemLogger.systemLogs,
};
