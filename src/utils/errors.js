/* eslint-disable max-classes-per-file */
const featherErrors = require('@feathersjs/errors');
const { ObjectId } = require('mongoose').Types;
/*
	console.log(featherErrors);
	https://docs.feathersjs.com/api/errors.html#examples
		convert:	[Function:	convert],
		FeathersError:	[Function:	FeathersError],
		BadRequest:	[Function:	BadRequest], x
		NotAuthenticated:	[Function:	NotAuthenticated], x
		PaymentError:	[Function:	PaymentError], x
		Forbidden:	[Function:	Forbidden], x
		NotFound:	[Function:	NotFound], x
		MethodNotAllowed:	[Function:	MethodNotAllowed], x
		NotAcceptable:	[Function:	NotAcceptable], x
		Timeout:	[Function:	Timeout], x
		Conflict:	[Function:	Conflict], x
		Gone:	[Function:	Gone],
		LengthRequired:	[Function:	LengthRequired], x
		Unprocessable:	[Function:	Unprocessable], x
		TooManyRequests:	[Function:	TooManyRequests], x
		GeneralError:	[Function:	GeneralError], x
		NotImplemented:	[Function:	NotImplemented], x
		BadGateway:	[Function:	BadGateway], x
		Unavailable:	[Function:	Unavailable] x
*/
const solvedTraceId = (ref, message, additional) => {
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
	ref.errors = Object.freeze(additional || {});
	ref.className = className;
	solvedTraceId(ref, message, additional);
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

class PageNotFound extends NotFound {
	constructor() {
		const overrideMessage = 'Page not found.';
		super(overrideMessage);
		this.className = 'page-not-found';
	}
}

// TODO we should look into it in context of new architecture
// ..at the moment it is only copy paste to this place.
class ApplicationError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

class SilentError extends ApplicationError {
	constructor(message) {
		super(message);
		this.className = 'silent-error';
	}
}
// take from ldap
class NoClientInstanceError extends Error {}

const isFeatherError = (error) => error instanceof featherErrors.FeathersError;

module.exports = {
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
	SilentError,
	PageNotFound,
	NoClientInstanceError,
	isFeatherError,
};
