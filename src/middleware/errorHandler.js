const Sentry = require('@sentry/node');
const express = require('@feathersjs/express');
const jwt = require('jsonwebtoken');

const { requestError } = require('../logger/systemLogger');
const logger = require('../logger');

const logRequestInfosInErrorCase = (error, req, res, next) => {
	if (error) {
		let decodedJWT;
		try {
			decodedJWT = jwt.decode(req.headers.authorization.replace('Bearer ', ''));
		} catch (err) {
			decodedJWT = {};
		}

		requestError(req, (decodedJWT || {}).userId, error);
		next(error);
	} else {
		next();
	}
};

const formatAndLogErrors = (showRequestId) => (error, req, res, next) => {
	if (error) {
		// clear data and add requestId
		error.data = showRequestId ? {
			requestId: req.headers.requestId,
		} : {};

		logger.error({ ...error });

		if (error.stack) {
			delete error.stack;
		}
		next(error);
	} else {
		next();
	}
};

const returnAsJson = express.errorHandler({
	html: (error, req, res) => {
		res.json(error);
	},
});

// map to lower case and test as lower case
const secretDataKeys = (() => [
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
].map((k) => k.toLocaleLowerCase())
)();
const filter = (data) => {
	const newData = Object.assign({}, data);
	Object.keys(newData).forEach((key) => {
		// secretDataKeys are lower keys
		if (secretDataKeys.includes(key.toLocaleLowerCase())) {
			newData[key] = '<secret>';
		}
	});
	return newData;
};

const secretQueryKeys = (() => [
	'accessToken',
	'access_token',
].map((k) => k.toLocaleLowerCase())
)();
const filterQuery = (url) => {
	let newUrl = url;
	secretQueryKeys.forEach((key) => {
		// key is lower case
		if (newUrl.toLocaleLowerCase().includes(key)) {
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
		next(error);
	} else {
		next();
	}
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
