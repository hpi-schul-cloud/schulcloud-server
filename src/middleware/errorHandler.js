const Sentry = require('@sentry/node');
const express = require('@feathersjs/express');
const decode = require('jwt-decode');

const { requestError } = require('../logger/systemLogger');
const logger = require('../logger');

const logRequestInfosInErrorCase = (error, req, res, next) => {
	if (error && !req.url.includes('/authentication')) {
		let decodedJWT;
		try {
			decodedJWT = decode(req.headers.authorization);
		} catch (err) {
			decodedJWT = {};
		}

		requestError(req, (decodedJWT || {}).userId, error);
	}
	next(error);
};

const formatErrors = (showRequestId) => (error, req, res, next) => {
	if (error) {
		error.data = showRequestId ? {	// clear data and add requestId
			requestId: req.headers.requestId,
		} : {};
		logger.error(error);
		if (error.stack) { // other errors
			// error.stack, showRequestId ? { requestId: req.headers.requestId } : {});
			delete error.stack;
		}
	}
	next(error);
};

const returnAsJson = express.errorHandler({
	html: (error, req, res) => {
		res.json(error);
	},
});

const errorHandler = (app) => {
	if (process.env.NODE_ENV !== 'test') {
		app.use(logRequestInfosInErrorCase);
	}
	app.use(Sentry.Handlers.errorHandler());
	app.use(formatErrors(process.env.NODE_ENV !== 'test'));
	app.use(returnAsJson);
};

module.exports = errorHandler;
