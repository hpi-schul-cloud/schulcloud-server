const Sentry = require('@sentry/node');
const express = require('@feathersjs/express');
const { Configuration } = require('@schul-cloud/commons');
const jwt = require('jsonwebtoken');
const { GeneralError } = require('../utils/errors');

const { NODE_ENV, ENVIRONMENTS } = require('../../config/globals');
const logger = require('../logger');
const { SilentError } = require('./errors');

const MAX_LEVEL_FILTER = 12;

const getRequestInfo = (req) => {
	const info = {
		url: req.originalUrl,
		data: req.body,
		method: req.method,
	};

	try {
		const decodedJWT = jwt.decode(req.headers.authorization.replace('Bearer ', ''));
		if (decodedJWT && decodedJWT.accountId) {
			info.user = {
				accountId: decodedJWT.accountId,
				aud: decodedJWT.aud,
				userId: decodedJWT.userId,
			};
			if (decodedJWT.support === true) {
				info.support = {
					supportJWT: true,
					supportUserId: decodedJWT.supportUserId,
				};
			}
		} else if (req.headers.authorization) {
			info.user = 'Can not decode jwt.';
		} else {
			info.user = 'No jwt is set.';
		}
	} catch (err) {
		// Maybe we found a better solution, but we can not display the full error message with stack trace
		info.user = err.message;
	}

	return info;
};

const formatAndLogErrors = (isTestRun) => (error, req, res, next) => {
	if (error) {
		if (error.className !== 'FeathersError') {
			// eslint-disable-next-line no-param-reassign
			error = new GeneralError(error);
		}

		// too much for logging...
		delete error.hook;
		// delete response informations for extern express applications
		delete error.response;
		// TODO discuss ..most of this errors are valid in testrun and should not logged
		// but for find out what is going wrong with an test it need a breakpoint to debug it
		// maybe error message without stacktrace is a solution or other debug level
		// info for error and ci is set to warning by testruns
		const loggingErrorMessage = { ...error };
		if (isTestRun === false) {
			loggingErrorMessage.request = getRequestInfo(req);
			logger.error(loggingErrorMessage);
		} else {
			logger.info(loggingErrorMessage);
		}
	}
	next(error);
};

const saveResponseFilter = (error) => ({
	name: error.name,
	message: error.message instanceof Error && error.message.message ? error.message.message : error.message,
	code: error.code,
	traceId: error.traceId,
});

const returnAsJson = express.errorHandler({
	html: (error, req, res) => {
		res.json(saveResponseFilter(error));
	},
	json: (error, req, res) => {
		res.json(saveResponseFilter(error));
	},
});

// map to lower case and test as lower case
const secretDataKeys = (() =>
	[
		'headers',
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
		'ticket',
		'firstName',
		'lastName',
		'email',
		'birthday',
		'description',
		'gradeComment',
		'_csrf',
	].map((k) => k.toLocaleLowerCase()))();

const filterSecretValue = (key, value) => {
	if (secretDataKeys.includes(key.toLocaleLowerCase())) {
		return '<secret>';
	}
	return value;
};

const filterDeep = (newData, level = 0) => {
	if (level > MAX_LEVEL_FILTER) {
		return '<max level exceeded>';
	}

	if (typeof newData === 'object' && newData !== null) {
		Object.entries(newData).forEach(([key, value]) => {
			const newValue = filterSecretValue(key, value);
			if (typeof newValue === 'string') {
				newData[key] = newValue;
			} else {
				filterDeep(value, level + 1);
			}
		});
	}
	return newData;
};

const filter = (data) => filterDeep({ ...data });

const secretQueryKeys = (() => ['accessToken', 'access_token'].map((k) => k.toLocaleLowerCase()))();
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

const handleSilentError = (error, req, res, next) => {
	if (error.name === SilentError.name || error.data.name === SilentError.name) {
		if (Configuration.get('SILENT_ERROR_ENABLED')) {
			res.append('x-silent-error', true);
		}
		res.status(200).json({ success: 'success' });
	} else {
		next(error);
	}
};

// important that it is not send to sentry, or add it to logs
const filterSecrets = (error, req, res, next) => {
	if (error) {
		// req.url = filterQuery(req.url);
		// originalUrl is used by sentry
		req.originalUrl = filterQuery(req.originalUrl);
		req.body = filter(req.body);
		error.data = filter(error.data);
		error.options = filter(error.options);
	}
	next(error);
};

const errorHandler = (app) => {
	app.use(filterSecrets);
	app.use(Sentry.Handlers.errorHandler());
	app.use(handleSilentError);
	app.use(formatAndLogErrors(NODE_ENV === ENVIRONMENTS.TEST));
	app.use(returnAsJson);
};

module.exports = errorHandler;
