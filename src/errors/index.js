/* eslint-disable max-classes-per-file */
const featherErrors = require('@feathersjs/errors');
const { ObjectId } = require('mongoose').Types;
const logger = require('../logger');

const {
	ApplicationError,
	ValidationError,
	SilentError,
	AssertionError,
	DocumentNotFound,
	InternalServerError,
} = require('./errors');

const setDefaultMessage = (className) => `Error of type ${className}`;

const resolvedTraceId = (ref, message, additional) => {
	if (message instanceof Error && message.traceId) {
		ref.traceId = message.traceId;
		delete message.traceId;
	} else if (additional instanceof Error && additional.traceId) {
		ref.traceId = additional.traceId;
		delete message.traceId;
	} else {
		const uid = ObjectId();
		ref.traceId = uid.toString();
	}
};

const prepare = (ref, message, additional, params, className) => {
	ref.name = ref.constructor.name;
	ref.data = Object.freeze({ ...params });
	if (!message) {
		logger.warning(`First parameter should set by errors of type ${className}`);
	}
	// for the case that only a error is passed
	if (message instanceof Error && !additional) {
		const err = message;
		// eslint-disable-next-line no-param-reassign
		message = setDefaultMessage(className);
		// eslint-disable-next-line no-param-reassign
		additional = err;
	}
	ref.errors = additional || {};
	ref.className = className;
	resolvedTraceId(ref, message, additional);
	// Error.captureStackTrace(ref, ref.constructor);
};

class BadRequest extends featherErrors.BadRequest {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'bad-request');
	}
}

class NotAuthenticated extends featherErrors.NotAuthenticated {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'not-authenticated');
	}
}

class AutoLogout extends featherErrors.NotAuthenticated {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'auto-logout');
	}
}

class PaymentError extends featherErrors.PaymentError {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'payment-error');
	}
}

class Forbidden extends featherErrors.Forbidden {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'forbidden');
	}
}

class NotFound extends featherErrors.NotFound {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'not-found');
	}
}

class MethodNotAllowed extends featherErrors.MethodNotAllowed {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'method-not-allowed');
	}
}

class NotAcceptable extends featherErrors.NotAcceptable {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'not-acceptable');
	}
}

class Timeout extends featherErrors.Timeout {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'timeout');
	}
}

class SlowQuery extends featherErrors.Timeout {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'slow-query');
	}
}

class Conflict extends featherErrors.Conflict {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'conflict');
	}
}

class LengthRequired extends featherErrors.LengthRequired {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'length-required');
	}
}

class Unprocessable extends featherErrors.Unprocessable {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'unprocessable');
	}
}

class TooManyRequests extends featherErrors.TooManyRequests {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'too-many-requests');
	}
}

class BruteForcePrevention extends featherErrors.TooManyRequests {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'brute-force-prevention');
	}
}

class GeneralError extends featherErrors.GeneralError {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'general-error');
		// keep original error location by re throwing errors
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, GeneralError);
		}
	}
}

class NotImplemented extends featherErrors.NotImplemented {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'not-implemented');
	}
}

class BadGateway extends featherErrors.BadGateway {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'bad-gateway');
	}
}

class Unavailable extends featherErrors.Unavailable {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'unavailable');
	}
}

class Gone extends featherErrors.Gone {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'gone');
	}
}

class PageNotFound extends NotFound {
	constructor() {
		const overrideMessage = 'Page not found.';
		super(overrideMessage);
		this.className = 'page-not-found';
	}
}

class UnhandledRejection extends featherErrors.GeneralError {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'unhandled-rejection');
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, UnhandledRejection);
		}
	}
}

class UnhandledException extends featherErrors.GeneralError {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, message, additional, params, 'unhandled-exception');
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, UnhandledException);
		}
	}
}

// take from ldap
class NoClientInstanceError extends Error {}

const errorsByCode = {
	400: BadRequest,
	401: NotAuthenticated,
	402: PaymentError,
	403: Forbidden,
	404: NotFound,
	405: MethodNotAllowed,
	406: NotAcceptable,
	408: Timeout,
	409: Conflict,
	410: Gone,
	411: LengthRequired,
	422: Unprocessable,
	429: TooManyRequests,
	500: GeneralError,
	501: NotImplemented,
	502: BadGateway,
	503: Unavailable,
};

module.exports = {
	ApplicationError,
	ValidationError,
	DocumentNotFound,
	InternalServerError,
	AssertionError,
	FeathersError: featherErrors.FeathersError,
	FeathersNotAuthenticated: featherErrors.NotAuthenticated,
	BadRequest,
	NotAuthenticated,
	AutoLogout,
	PaymentError,
	Forbidden,
	NotFound,
	MethodNotAllowed,
	NotAcceptable,
	Timeout,
	SlowQuery,
	Conflict,
	LengthRequired,
	Unprocessable,
	TooManyRequests,
	BruteForcePrevention,
	GeneralError,
	NotImplemented,
	BadGateway,
	Unavailable,
	PageNotFound,
	Gone,
	UnhandledRejection,
	UnhandledException,
	NoClientInstanceError,
	SilentError,
	errorsByCode,
};
