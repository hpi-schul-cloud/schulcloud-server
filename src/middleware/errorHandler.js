const { Configuration } = require('@hpi-schul-cloud/commons');
const jwt = require('jsonwebtoken');
const OpenApiValidator = require('express-openapi-validator');

const { SilentError, PageNotFound, AutoLogout, BruteForcePrevention } = require('../errors');
const {
	BusinessError,
	TechnicalError,
	ValidationError,
	DocumentNotFound,
	AssertionError,
	InternalServerError,
} = require('../errors');
const { API_VALIDATION_ERROR_TYPE } = require('../errors/commonErrorTypes');

const { isApplicationError, isFeatherError, isSilentError, cleanupIncomingMessage } = require('../errors/utils');
const logger = require('../logger');
const { isSensitiveName } = require('../../dist/apps/server/infra/logger/sensitive-value');

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

const getErrorLogData = (error) => {
	let errorLogData;
	if (isApplicationError(error) || isFeatherError(error)) {
		// Application and Feathers Errors - sanitized by filterSecrets
		// type is override by logger for logging type
		errorLogData = { ...error, errorType: error.type };
		// nested in errors
		cleanupIncomingMessage(errorLogData.errors);
	} else {
		// Unhandled Errors
		errorLogData = error;
	}
	return errorLogData;
};

const skipErrorLogging = (error) =>
	error instanceof PageNotFound ||
	error.code === 405 ||
	error instanceof AutoLogout ||
	error instanceof BruteForcePrevention;

const formatAndLogErrors = (error, req, res, next) => {
	if (error) {
		if (skipErrorLogging(error)) {
			logger.debug(error);
			logger.warning(error.name);
			return next(error);
		}

		const errorLogData = getErrorLogData(error);
		const requestInfo = getRequestInfo(req);

		// for tests level is set to emerg, set LOG_LEVEL=debug for see it
		// Logging the error object won't print error's stack trace. You need to ask for it specifically
		logger.error({ ...errorLogData, ...requestInfo });
	}
	return next(error);
};

// Personal data and other Feathers-only fields, deliberately not in the shared secret rule (isSensitiveName),
// so that the Nest logger keeps logging them. Passwords, tokens, authorization and the like come from isSensitiveName.
// Compared in lower case.
const additionalSecretDataKeys = [
	'headers',
	'ticket',
	'firstName',
	'lastName',
	'email',
	'birthday',
	'description',
	'gradeComment',
	'_csrf',
	'student-email',
	'toHash',
].map((k) => k.toLocaleLowerCase());

const isSecretDataKey = (key) => isSensitiveName(key) || additionalSecretDataKeys.includes(key.toLocaleLowerCase());

const filterSecretValue = (key, value) => {
	// Booleans are not masked: they cannot hold a credential and flags such as forcePasswordChange must stay readable.
	if (isSecretDataKey(key) && typeof value !== 'boolean') {
		// E-Mail-Maskierung, falls value eine E-Mail-Adresse ist
		if (typeof value === 'string' && /^[^@\s]{3,}[^@\s]*@[^@\s]+\.[^@\s]+$/.test(value)) {
			// Split in local und domain
			const [local, domain] = value.split('@');
			if (local.length > 3) {
				const masked = local.slice(0, 3) + '*'.repeat(local.length - 3);
				return masked + '@' + domain;
			} else {
				// Weniger als 3 Zeichen vor dem @, alles maskieren
				return '*'.repeat(local.length) + '@' + domain;
			}
		}
		return '<secret>';
	}
	return value;
};

const shallowCopy = (value) =>
	Array.isArray(value) ? [...value] : Object.assign(Object.create(Object.getPrototypeOf(value)), value);

/**
 * Returns the value with secrets replaced. Objects that contain a secret are copied, never changed:
 * nested objects can be shared with other code (e.g. a cached system config), writing into them would corrupt it.
 * Objects without secrets are returned as they are. Values nested deeper than MAX_LEVEL_FILTER are not filtered (as before).
 */
const filterValue = (value, level, state) => {
	if (typeof value !== 'object' || value === null || level > MAX_LEVEL_FILTER) {
		return value;
	}
	if (state.done.has(value)) {
		return state.done.get(value);
	}
	// A cycle back to an object that is still being filtered points to its copy, which is filled below.
	if (state.inProgress.has(value)) {
		const pending = state.inProgress.get(value);
		pending.copy = pending.copy || shallowCopy(value);
		return pending.copy;
	}

	const pending = {};
	state.inProgress.set(value, pending);
	const changes = [];
	Object.entries(value).forEach(([key, item]) => {
		const maskedItem = filterSecretValue(key, item);
		const newItem = typeof maskedItem === 'string' ? maskedItem : filterValue(item, level + 1, state);
		if (newItem !== item) {
			changes.push([key, newItem]);
		}
	});
	state.inProgress.delete(value);

	let result = value;
	if (changes.length > 0 || pending.copy) {
		result = pending.copy || shallowCopy(value);
		changes.forEach(([key, newItem]) => {
			result[key] = newItem;
		});
	}
	state.done.set(value, result);

	return result;
};

const createFilterState = () => ({ done: new WeakMap(), inProgress: new WeakMap() });

/**
 * Replaces secrets in the own fields of an object that belongs to the error (e.g. error.error),
 * so that its prototype chain stays intact. Nested objects are copied, not changed.
 */
const filterOwnFields = (data) => {
	const state = createFilterState();
	Object.entries(data).forEach(([key, value]) => {
		const maskedValue = filterSecretValue(key, value);
		const newValue = typeof maskedValue === 'string' ? maskedValue : filterValue(value, 1, state);
		if (newValue !== value) {
			data[key] = newValue;
		}
	});
};

const filter = (data) => filterValue({ ...data }, 0, createFilterState());

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

/**
 * Filters sensitive data from known nested properties of an error object
 * (options, response, response.request). Does not recurse into arbitrary structures.
 * @param {Object} errorObj - The error object to filter
 */
const filterErrorObject = (errorObj) => {
	if (!errorObj || typeof errorObj !== 'object') {
		return;
	}

	if (errorObj.options) {
		errorObj.options = filter(errorObj.options);
	}
	if (errorObj.response) {
		errorObj.response = filter(errorObj.response);
		if (errorObj.response.request) {
			errorObj.response.request = filter(errorObj.response.request);
		}
	}
};

// important that it is not added it to logs
const filterSecrets = (error, req, res, next) => {
	if (error) {
		// req.url = filterQuery(req.url);
		req.originalUrl = filterQuery(req.originalUrl);
		req.headers = filter(req.headers);
		req.body = filter(req.body);
		error.data = filter(error.data);
		error.options = filter(error.options);
		error.params = filter(error.params);
		// Filter sensitive data from error.response (e.g., from request-promise errors)
		filterErrorObject(error);
		// Filter nested error objects (e.g., StatusCodeError wraps error in error.error)
		if (error.error && typeof error.error === 'object') {
			// Filter the own fields directly to preserve Error prototype chain
			// (e.g., SilentError instances need instanceof checks later)
			filterOwnFields(error.error);
			filterErrorObject(error.error);
		}
	}
	return next(error);
};

const createErrorDetailTO = (code, type, title, message, customFields = {}) => ({
	code,
	type,
	title,
	message,
	...customFields,
});

const getErrorResponseFromBusinessError = (error) => {
	const customFields = {};
	let code = 500;
	const { message: type, title, defaultMessage: message } = error;

	if (error instanceof BusinessError) {
		if (error instanceof ValidationError) {
			code = 400;
			Object.assign(customFields, { validation_errors: error.params });
		}
	} else if (error instanceof TechnicalError) {
		if (error instanceof DocumentNotFound) {
			code = 404;
		} else if (error instanceof AssertionError) {
			Object.assign(customFields, { assertion_errors: error.params });
		}
	}

	return createErrorDetailTO(code, type, title, message, customFields);
};

const getMessageFromUnhandledError = (error) =>
	error.message instanceof Error && error.message.message ? error.message.message : error.message;

const getErrorResponse = (error, req, res, next) => {
	let errorDetail;
	if (isSilentError(error)) {
		// do not return this as error via REST
		return res.status(200).json(SilentError.RESPONSE_CONTENT);
	}
	if (isApplicationError(error)) {
		// Application Errors
		errorDetail = getErrorResponseFromBusinessError(error);
	} else if (isFeatherError(error)) {
		// Framework Errors
		const { code, className: type, name: title, message } = error;
		errorDetail = createErrorDetailTO(code, type, title, message);
	} else {
		// Unhandled Errors
		const message = getMessageFromUnhandledError(error);
		const unhandledError = new InternalServerError(error);
		const { message: type, title } = unhandledError;
		errorDetail = createErrorDetailTO(500, type, title, message);
	}

	return res.status(errorDetail.code).json(errorDetail);
};

const convertOpenApiValidationError = (error) => {
	// todo: handle other validation errors so they are formatted properly
	let err = error;
	if (error instanceof OpenApiValidator.error.NotFound) {
		logger.debug('Open API Validation path is missing!');
		err = new PageNotFound(error);
	} else if (err instanceof OpenApiValidator.error.BadRequest) {
		err = new ValidationError(API_VALIDATION_ERROR_TYPE, err.errors);
	}
	return err;
};

const convertExternalLibraryErrors = (error, req, res, next) => {
	const err = convertOpenApiValidationError(error);
	return next(err);
};

const addTraceId = (error, req, res, next) => {
	error.traceId = (req.headers || {}).requestId || error.traceId;
	return next(error);
};

const errorHandler = (app) => {
	app.use(addTraceId);
	app.use(filterSecrets);
	app.use(convertExternalLibraryErrors);
	app.use(formatAndLogErrors);
	app.use(getErrorResponse);
};
module.exports = errorHandler;
module.exports.isSecretDataKey = isSecretDataKey;
