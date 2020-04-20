const Sentry = require('@sentry/node');
const express = require('@feathersjs/express');
const { GeneralError } = require('@feathersjs/errors');
const jwt = require('jsonwebtoken');

const { requestError } = require('../logger/systemLogger');
const { NODE_ENV, ENVIRONMENTS } = require('../../config/globals');
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
	}
	next(error);
};

const formatAndLogErrors = (isTestRun) => (error, req, res, next) => {
	if (error) {
		// delete response informations for extern express applications
		delete error.response;
		if (error.options) {
			// can include jwts if error it throw by extern micro services
			delete error.options.headers;
		}
		if (isTestRun === false) {
			logger.error({ ...error });
		}
		if (error.code === 500) {
			// eslint-disable-next-line no-param-reassign
			error = new GeneralError(error);
		}
		// if exist delete it
		delete error.stack;
		// delete error.catchedError;

		// clear data and add requestId
		error.data = isTestRun === false ? {
			requestId: req.headers.requestId,
		} : {};
	}
	next(error);
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
	'password-1',
	'password-2',
	'password_verification',
	'password_control',
	'PASSWORD_HASH',
	'password_new',
	'accessToken',
].map((k) => k.toLocaleLowerCase())
)();
const filter = (data) => {
	const newData = { ...data };
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
	}
	next(error);
};

const errorHandler = (app) => {
	app.use(filterSecrets);
	if (NODE_ENV !== ENVIRONMENTS.TEST) {
		app.use(logRequestInfosInErrorCase);
	}

	app.use(Sentry.Handlers.errorHandler());
	app.use(formatAndLogErrors(NODE_ENV !== ENVIRONMENTS.TEST));
	app.use(returnAsJson);
};

module.exports = errorHandler;
