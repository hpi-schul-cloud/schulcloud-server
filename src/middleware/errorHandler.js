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
		// Application and Feathers Errors - the log entry is masked by createLogEntry
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
			logger.debug(createLogEntry(() => error, error));
			logger.warning(error.name);
			return next(error);
		}

		// for tests level is set to emerg, set LOG_LEVEL=debug for see it
		// Logging the error object won't print error's stack trace. You need to ask for it specifically
		// Only the log entry is masked, as a copy: the error and the request stay untouched.
		const logEntry = createLogEntry(() => {
			const errorLogData = getErrorLogData(error);
			const requestInfo = getRequestInfo(req);

			return { ...errorLogData, ...requestInfo };
		}, error);
		logger.error(logEntry);
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

// Only values of these keys are masked as an email address (som****@example.org); other secrets become '<secret>'.
const emailDataKeys = ['email', 'student-email'];

const isSecretDataKey = (key) => isSensitiveName(key) || additionalSecretDataKeys.includes(key.toLocaleLowerCase());

const maskEmail = (value) => {
	const [local, domain] = value.split('@');
	if (local.length > 3) {
		return `${local.slice(0, 3)}${'*'.repeat(local.length - 3)}@${domain}`;
	}

	return `${'*'.repeat(local.length)}@${domain}`;
};

const filterSecretValue = (key, value) => {
	// Booleans are not masked: they cannot hold a credential and flags such as forcePasswordChange must stay readable.
	if (!isSecretDataKey(key) || typeof value === 'boolean') {
		return value;
	}

	const isEmailKey = emailDataKeys.includes(key.toLocaleLowerCase());
	if (isEmailKey && typeof value === 'string' && /^[^@\s]{3,}[^@\s]*@[^@\s]+\.[^@\s]+$/.test(value)) {
		return maskEmail(value);
	}

	return '<secret>';
};

// Same prototype, own enumerable fields; an Error also keeps its name, message and stack.
const shallowCopy = (value) => {
	if (Array.isArray(value)) {
		return [...value];
	}

	const copy = Object.create(Object.getPrototypeOf(value));
	const keys = value instanceof Error ? ['name', 'message', 'stack', ...Object.keys(value)] : Object.keys(value);
	keys.forEach((key) => {
		const descriptor = Object.getOwnPropertyDescriptor(value, key);
		if (descriptor) {
			// A data property in any case: the value is read once, getters of the original are not copied.
			Object.defineProperty(copy, key, {
				value: value[key],
				enumerable: descriptor.enumerable,
				writable: true,
				configurable: true,
			});
		}
	});

	return copy;
};

const isPlainObject = (value) => {
	const prototype = Object.getPrototypeOf(value);

	return prototype === Object.prototype || prototype === null;
};

const isObjectId = (value) => value._bsontype === 'ObjectId';

const isBinary = (value) =>
	value instanceof ArrayBuffer ||
	(typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer) ||
	ArrayBuffer.isView(value);

const getClassName = (value) => {
	const { constructor } = Object.getPrototypeOf(value);

	return typeof constructor === 'function' && constructor.name ? constructor.name : 'Object';
};

/**
 * Objects that are not walked field by field: request, response, socket, agent, stream or cookie jar objects
 * are large and hold raw header strings (ClientRequest._header, IncomingMessage.rawHeaders) with credentials.
 * Returns the value to log instead, or undefined for plain objects, arrays and errors, which are masked.
 */
const summarizeObject = (value) => {
	if (Array.isArray(value) || value instanceof Error || isPlainObject(value)) {
		return undefined;
	}
	// Logged as before: as an ISO date and as the hex id.
	if (value instanceof Date || isObjectId(value)) {
		return value;
	}
	if (isBinary(value)) {
		return `[Binary ${value.byteLength} bytes]`;
	}

	return `[${getClassName(value)}]`;
};

/**
 * Returns the value with secrets replaced. Only plain objects, arrays and errors are walked; other objects
 * are summarized (summarizeObject). An object that contains a secret is copied, never changed:
 * the same objects are used elsewhere (reused request options, cookie jars).
 * An object without secrets is returned as it is.
 * Each original object gets one copy per log entry (state), so an object reachable on several paths
 * (axios error.config === error.response.config) is masked the same on all of them, and cycles end.
 */
const maskValue = (value, level, state) => {
	if (typeof value !== 'object' || value === null) {
		return value;
	}
	const summary = summarizeObject(value);
	if (summary !== undefined) {
		return summary;
	}
	if (level > MAX_LEVEL_FILTER) {
		return '<max level exceeded>';
	}
	if (state.done.has(value)) {
		return state.done.get(value);
	}
	// A cycle back to an object that is still being masked points to its copy, which is filled below.
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
		const newItem = maskedItem !== item ? maskedItem : maskValue(item, level + 1, state);
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

// One masking pass over everything that is logged.
const maskLogEntry = (entry) => maskValue(entry, 0, { done: new WeakMap(), inProgress: new WeakMap() });

const readSafely = (read) => {
	try {
		return read();
	} catch {
		return undefined;
	}
};

/**
 * Builds and masks the log entry and never throws: if that fails (e.g. a getter that throws),
 * only the error name and message are logged, never the unmasked data.
 */
const createLogEntry = (buildEntry, error) => {
	try {
		return maskLogEntry(buildEntry());
	} catch {
		const name = readSafely(() => error.name);
		const message = readSafely(() => error.message);

		return {
			name: typeof name === 'string' ? name : undefined,
			message: typeof message === 'string' ? message : undefined,
			maskingFailed: true,
		};
	}
};

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

// The params of application errors are returned to the client (validation_errors, assertion_errors).
// They were masked before the response was built; this keeps that, without changing the error.
const maskedResponseParams = new WeakMap();

// important that it is not added it to logs
const filterSecrets = (error, req, res, next) => {
	if (error) {
		// req.url = filterQuery(req.url);
		req.originalUrl = filterQuery(req.originalUrl);
		if (typeof error === 'object') {
			let params;
			try {
				params = maskLogEntry({ ...error.params });
			} catch {
				// Never return unmasked params to the client.
				params = '<secret>';
			}
			maskedResponseParams.set(error, params);
		}
	}
	return next(error);
};

const getResponseParams = (error) => (maskedResponseParams.has(error) ? maskedResponseParams.get(error) : error.params);

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
			Object.assign(customFields, { validation_errors: getResponseParams(error) });
		}
	} else if (error instanceof TechnicalError) {
		if (error instanceof DocumentNotFound) {
			code = 404;
		} else if (error instanceof AssertionError) {
			Object.assign(customFields, { assertion_errors: getResponseParams(error) });
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
