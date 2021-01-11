/* eslint-disable max-classes-per-file */
const { INTERNAL_SERVER_ERROR_TYPE, ASSERTION_ERROR_TYPE } = require('./commonErrorTypes');

/**
 * A base Class for all application specific (not-framework related) errors
 * Please do not use this class directly - please use one of the subclass below
 * @abstract
 */
class ApplicationError extends Error {
	/**
	 * Abstraction for concrete implementations of business errors
	 */
	constructor({ type, title, defaultMessage }, cause, params) {
		super(type);
		this.name = this.constructor.name;
		this.cause = cause;
		this.title = title;
		this.defaultMessage = defaultMessage;
		this.params = params;
		Error.captureStackTrace(this, this.constructor);
	}
}

class InternalServerError extends ApplicationError {
	constructor(cause, params) {
		super(INTERNAL_SERVER_ERROR_TYPE, cause, params);
	}
}

class SilentError extends ApplicationError {
	constructor(message) {
		// hide the real cause - is not a part of any response object
		super({ type: message });
	}

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
		super(ASSERTION_ERROR_TYPE, undefined, validationErrors);
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
