const Sentry = require('@sentry/node');
const express = require('@feathersjs/express');
const decode = require('jwt-decode');

const { requestError } = require('../logger/systemLogger');
const logger = require('../logger');

const logRequestInfosInErrorCase = (error, req, res, next) => {
	if (error) {
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

const formatAndLogErrors = (showRequestId) => (error, req, res, next) => {
	if (error) {
		// clear data and add requestId
		error.data = showRequestId ? {
			requestId: req.headers.requestId,
		} : {};

		logger.error(error);

		if (error.stack) {
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
			newData[key] = '<secret>';
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

// important that it is not send to sentry, or add it to logs
const filterSecrets = (error, req, res, next) => {
	if (error) {
		// req.url = filterQuery(req.url);
		// originalUrl is used by sentry
		req.originalUrl = filterQuery(req.originalUrl);
		req.body = filter(req.body);
		error.data = filter(error.data);
	}
	next(error);
};

const errorHandler = (app) => {
	app.use(filterSecrets);
	if (process.env.NODE_ENV !== 'test') {
		app.use(logRequestInfosInErrorCase);
	}
	app.use(Sentry.Handlers.errorHandler());
	app.use(formatAndLogErrors(process.env.NODE_ENV !== 'test'));
	app.use(returnAsJson);
};

module.exports = errorHandler;
