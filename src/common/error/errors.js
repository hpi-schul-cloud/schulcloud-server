/* eslint-disable max-classes-per-file */
const { INTERNAL_SERVER_ERROR } = require('./commonErrors');

class ApplicationError extends Error {
	constructor(appError, cause, params) {
		super(appError.code);
		this.name = this.constructor.name;
		this.cause = cause;
		this.title = appError.title;
		this.defaultMessage = appError.defaultMessage;
		this.params = params;
		Error.captureStackTrace(this, this.constructor);
	}
}

class InternalServerError extends ApplicationError {
	constructor(cause) {
		super(INTERNAL_SERVER_ERROR, cause);
	}
}

class SilentError extends ApplicationError {
}

class DocumentNotFound extends ApplicationError {
}

class ValidationError extends ApplicationError {
	constructor(appError, validationErrors) {
		super(appError, undefined, validationErrors);
	}
}

module.exports = {
	ApplicationError,
	InternalServerError,
	SilentError,
	DocumentNotFound,
	ValidationError,
};
