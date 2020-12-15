/* eslint-disable max-classes-per-file */
const { INTERNAL_SERVER_ERROR, ASSERTION_ERROR } = require('./commonErrorTypes');

class ApplicationError extends Error {
	constructor(errorType, cause, params) {
		super(errorType.code);
		this.name = this.constructor.name;
		this.cause = cause;
		this.title = errorType.title;
		this.defaultMessage = errorType.defaultMessage;
		this.params = params;
		Error.captureStackTrace(this, this.constructor);
	}
}

class InternalServerError extends ApplicationError {
	constructor(cause) {
		super(INTERNAL_SERVER_ERROR, cause);
	}
}

class SilentError extends ApplicationError {}

class DocumentNotFound extends ApplicationError {}

class ValidationError extends ApplicationError {
	constructor(errorType, validationErrors) {
		super(errorType, undefined, validationErrors);
	}
}

class AssertionError extends ApplicationError {
	constructor(validationErrors) {
		super(ASSERTION_ERROR, undefined, validationErrors);
	}
}

module.exports = {
	ApplicationError,
	InternalServerError,
	SilentError,
	DocumentNotFound,
	ValidationError,
	AssertionError,
};
