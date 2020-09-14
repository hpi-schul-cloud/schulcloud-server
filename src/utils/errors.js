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

const prepare = (ref, additional, params) => {
	ref.name = ref.constructor.name;
	ref.className = 'FeathersError';
	ref.data = Object.freeze({ ...params });
	ref.errors = Object.freeze(additional || {});
};

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

class BadRequest extends featherErrors.BadRequest {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);
	}
}

class NotAuthenticated extends featherErrors.NotAuthenticated {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);
	}
}

class PaymentError extends featherErrors.PaymentError {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);
	}
}

class Forbidden extends featherErrors.Forbidden {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);
	}
}

class NotFound extends featherErrors.NotFound {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);
	}
}

class MethodNotAllowed extends featherErrors.MethodNotAllowed {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);
	}
}

class NotAcceptable extends featherErrors.NotAcceptable {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);
	}
}

class Timeout extends featherErrors.Timeout {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);
	}
}

class Conflict extends featherErrors.Conflict {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);
	}
}

class LengthRequired extends featherErrors.LengthRequired {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);
	}
}

class Unprocessable extends featherErrors.Unprocessable {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);
	}
}

class TooManyRequests extends featherErrors.TooManyRequests {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);
	}
}

class GeneralError extends featherErrors.GeneralError {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, GeneralError);
		}
	}
}

class NotImplemented extends featherErrors.NotImplemented {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);
	}
}

class BadGateway extends featherErrors.BadGateway {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);
	}
}

class Unavailable extends featherErrors.Unavailable {
	constructor(message, additional, ...params) {
		super(message, additional, ...params);
		prepare(this, additional, params);
		solvedTraceId(this, message, additional);
	}
}

module.exports = {
	BadRequest,
	NotAuthenticated,
	PaymentError,
	Forbidden,
	NotFound,
	MethodNotAllowed,
	NotAcceptable,
	Timeout,
	Conflict,
	LengthRequired,
	Unprocessable,
	TooManyRequests,
	GeneralError,
	NotImplemented,
	BadGateway,
	Unavailable,
};
