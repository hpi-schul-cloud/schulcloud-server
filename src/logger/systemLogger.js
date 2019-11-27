const winston = require('winston');
const util = require('util');

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
			handleExceptions: true,
		}),
	],
	exitOnError: false,
});

const secretDataKeys = [
	'password',
	'passwort',
	'new_password',
	'new-password',
	'oauth-password',
	'current-password',
	'passwort_1',
	'passwort_2',
	'password_1',
	'password_2',
	'password_verification',
	'password_control',
	'PASSWORD_HASH',
	'password_new',
];
const filter = (data) => {
	const newData = Object.assign({}, data);
	Object.keys(newData).forEach((key) => {
		if (secretDataKeys.includes(key)) {
			delete newData[key];
		}
	});
	return newData;
};

const secretQueryKeys = [
	'accessToken',
	'access_token',
];
const filterQuery = (url) => {
	let newUrl = url;
	secretQueryKeys.forEach((key) => {
		if (newUrl.includes(key)) {
			// first step cut complet query
			// maybe todo later add query as object of keys and remove keys with filter
			newUrl = url.split('?')[0];
			newUrl += '?<secretQuery>';
		}
	});
	return newUrl;
};

const requestError = (req, userId = 'noUserId', error) => systemLogger.requestError(util.inspect({
	type: 'RequestError',
	requestId: req.headers.requestId,
	userId,
	url: filterQuery(req.url),
	data: filter(req.body),
	method: req.method,
	timestamp: new Date(),
	code: error.code,
}, {
	depth: 5, compact: false, breakLength: 120,
}));

module.exports = {
	requestError,
	// sendRequests: systemLogger.sendRequests,
	// requestInfo: request,
	systemInfo: systemLogger.systemLogs,
};
