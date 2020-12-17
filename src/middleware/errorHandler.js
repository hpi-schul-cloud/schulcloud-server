const Sentry = require('@sentry/node');
const express = require('@feathersjs/express');
const { Configuration } = require('@hpi-schul-cloud/commons');
const jwt = require('jsonwebtoken');
const OpenApiValidator = require('express-openapi-validator');

const reqlib = require('app-root-path').require;

const { SilentError, PageNotFound, AutoLogout, BruteForcePrevention, BadRequest } = reqlib('src/errors');
const { convertToFeathersError, cleanupIncomingMessage } = reqlib('src/errors/utils');

const logger = require('../logger');

const MAX_LEVEL_FILTER = 12;

const getRequestInfo = (req) => {
	const info = {
		url: req.originalUrl,
		data: req.body,
		method: req.method,
	};

	try {
		let decodedJWT;
		if (req.headers.authorization) {
			decodedJWT = jwt.decode(req.headers.authorization.replace('Bearer ', ''));
		}

		if (decodedJWT && decodedJWT.accountId) {
			info.user = {
				accountId: decodedJWT.accountId,
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
		// it can contain jwt informations
		info.user = err.message;
	}

	return info;
};

const formatAndLogErrors = (error, req, res, next) => {
	if (error) {
		// sanitize
		const err = convertToFeathersError(error);
		const requestInfo = getRequestInfo(req);
		// type is override by logger for logging type
		err.errorType = err.type;

		// nested in errors
		cleanupIncomingMessage(err.errors);
		// for tests level is set to emerg, set LOG_LEVEL=debug for see it
		// Logging the error object won't print error's stack trace. You need to ask for it specifically
		logger.error({ ...err, ...requestInfo });
	}
	next(error);
};

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
		'searchUserPassword',
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

// important that it is not sent to sentry, or added it to logs
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

const saveResponseFilter = (error) => ({
	name: error.name,
	message: error.message instanceof Error && error.message.message ? error.message.message : error.message,
	code: error.code,
	traceId: error.traceId,
});

const sendError = (res, error) => {
	res.status(error.code).json(saveResponseFilter(error));
};

const handleSilentError = (error, req, res, next) => {
	if (error instanceof SilentError || (error && error.error instanceof SilentError)) {
		if (Configuration.get('SILENT_ERROR_ENABLED')) {
			res.append('x-silent-error', true);
		}
		res.status(200).json({ success: 'success' });
	} else {
		next(error);
	}
};

const handleValidationError = (error, req, res, next) => {
	// todo: handle other validation errors so they are formatted properly
	let err = error;
	if (error instanceof OpenApiValidator.error.NotFound) {
		err = new PageNotFound(error);
	} else if (err instanceof OpenApiValidator.error.BadRequest) {
		err = new BadRequest(error);
	}
	next(err);
};

const skipErrorLogging = (error, req, res, next) => {
	if (
		error instanceof PageNotFound ||
		error.code === 405 ||
		error instanceof AutoLogout ||
		error instanceof BruteForcePrevention
	) {
		logger.debug(error);
		logger.warning(error.name);
		sendError(res, error);
	} else {
		next(error);
	}
};

const returnAsJson = express.errorHandler({
	html: (error, req, res) => {
		sendError(res, error);
	},
	json: (error, req, res) => {
		sendError(res, error);
	},
});

const addTraceId = (error, req, res, next) => {
	error.traceId = (req.headers || {}).requestId || error.traceId;
	next(error);
};

const errorHandler = (app) => {
	app.use(addTraceId);
	app.use(filterSecrets);
	app.use(Sentry.Handlers.errorHandler());
	app.use(handleValidationError);
	// TODO make skipErrorLogging configruable if middleware is added
	app.use(skipErrorLogging);
	app.use(formatAndLogErrors);
	// TODO make handleSilentError configruable if middleware is added
	// Configuration.get('SILENT_ERROR_ENABLED')
	app.use(handleSilentError);
	app.use(returnAsJson);
};
module.exports = errorHandler;
