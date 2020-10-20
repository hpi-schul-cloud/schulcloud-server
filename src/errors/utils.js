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
		// Possible to pass secret Filter for headers and querys in uri
		// Possible to move out all functions keys like callback
	}
};

module.exports = {
	isFeatherError,
	convertToFeathersError,
	cleanupIncomingMessage,
};
