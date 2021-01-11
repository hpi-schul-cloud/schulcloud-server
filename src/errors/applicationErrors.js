/* eslint-disable max-classes-per-file */
const { INTERNAL_SERVER_ERROR, ASSERTION_ERROR } = require('./commonErrorTypes');

class ApplicationError extends Error {
	/**
	 * Abstraction for concrete implementations of business errors
	 */
	constructor({ type, title, defaultMessage }, cause, params) {
		super(type);
		this.name = this.constructor.name;
		this.cause = cause;
		this.title = title;
		this.defaultMessage = defaultMessage; // todo rename to detail (as defined?)
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
	/**
	 * A silent error is thrown when we not want to report it to a user via REST. Instead this property content is returned in case of success and error.
	 */
	static get RESPONSE_CONTENT() {
		return { success: 'success' };
	}
}

class DocumentNotFound extends ApplicationError {}

/**
 * Error for api request validation
 */
class ValidationError extends ApplicationError {
	constructor(errorType, validationErrors) {
		super(errorType, undefined, validationErrors);
	}
}

/**
 * Error for parameter assertions.
 * @see {validationErrors} in src/common/validation/validationHelper.js
 */
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
