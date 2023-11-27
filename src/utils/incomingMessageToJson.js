const http = require('http');

const logger = require('../logger');

const incomingMessageToJson = (incomingMessage) => {
	if (!(incomingMessage instanceof http.IncomingMessage)) {
		logger.error('Input is not a instance of http.IncomingMessage', incomingMessage);
		return incomingMessage;
	}

	const { statusMessage, statusCode, method, httpVersion, headers, url, body } = incomingMessage;
	return {
		statusMessage,
		statusCode,
		method,
		httpVersion,
		headers,
		url,
		body,
	};
};

module.exports = incomingMessageToJson;
