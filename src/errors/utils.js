const http = require('http');
const Sentry = require('@sentry/node');
const { Configuration } = require('@hpi-schul-cloud/commons');
const reqlib = require('app-root-path').require;

const { incomingMessageToJson } = reqlib('src/utils');

const logger = require('../logger');
const { errorsByCode } = require('./index.js');

const isFeatherError = (error) => error.type === 'FeathersError';

const convertToFeathersError = (error) => {
	if (isFeatherError(error)) {
		return error;
	}
	let code = error.code || error.statusCode || 500;
	if (!(typeof errorsByCode[code] === 'function')) {
		code = 500;
	}
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

// TODO please rename if you found a better name
const asyncErrorLog = (err, message) => {
	if (message) {
		logger.error(message, err);
	} else {
		logger.error(err);
	}
	// TODO execute filter must outsource from error pipline
	if (Configuration.has('SENTRY_DSN')) {
		Sentry.captureException(err);
	}
};

module.exports = {
	isFeatherError,
	convertToFeathersError,
	cleanupIncomingMessage,
	asyncErrorLog,
};
