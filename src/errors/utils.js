const http = require('http');
const reqlib = require('app-root-path').require;

const { incomingMessageToJson } = reqlib('src/utils');

const { errorsByCode } = require('./index.js');

const isFeatherError = (error) => error.type === 'FeathersError';

const convertToFeathersError = (error) => {
	if (isFeatherError(error)) {
		return error;
	}
	const code = error.code || error.statusCode || 500;
	return new errorsByCode[code](error);
};

const cleanupIncomingMessage = (error = {}) => {
	if (error.response instanceof http.IncomingMessage) {
		error.response = incomingMessageToJson(error.response);
	}
	if (typeof error.options === 'object') {
		if (Buffer.isBuffer(error.options.body)) {
			delete error.options.body;
		}
		// filter undefined keys and functions like callback
		error.options = JSON.stringify(error.options);
	}
};

module.exports = {
	isFeatherError,
	convertToFeathersError,
	cleanupIncomingMessage,
};
