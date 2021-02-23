/* eslint-disable max-classes-per-file */
const { INTERNAL_SERVER_ERROR_TYPE, ASSERTION_ERROR_TYPE, FORBIDDEN_ERROR_TYPE } = require('./commonErrorTypes');

/**
 * A base Class for all application specific (not-framework related) errors
 * Please do not use this class directly - please use one of the subclass below
 * @abstract
 */
class ApplicationError extends Error {
	/**
	 * Abstraction for concrete implementations of business errors
	 * @param {String|Error|any} cause Cause is used for technical errors only and will take any argument (existing error, string, ...). BusinessErrors instead should be defined within of an own Error_TYPE.
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

/**
 * A base Class for all Technical errors
 * Please do not use this class directly - please use one of the subclass below
 * @abstract
 */
class TechnicalError extends ApplicationError {}

/**
 * A base Class for all Business Logic errors
 * Please do not use this class directly - please use one of the subclass below
 * @abstract
 */
class BusinessError extends ApplicationError {}

// TECHNICAL ERRORS
/**
 * An Error wrapper class for all unrecoverable, technical errors
 */
class InternalServerError extends TechnicalError {
	constructor(cause, params) {
		super(INTERNAL_SERVER_ERROR_TYPE, cause, params);
	}
}

/**
 * For Resource/Document not found cases
 */
class DocumentNotFound extends TechnicalError {}

/**
 * Error for parameter assertions.
 * @see {validationErrors} in src/common/validation/validationHelper.js
 */
class AssertionError extends TechnicalError {
	constructor(validationErrors) {
		super(ASSERTION_ERROR_TYPE, undefined, validationErrors);
	}
}

// BUSINESS ERRORS
/**
 * Error for any validation error that should be handled by clients
 * Error details can be added into validationErrors for error type API_VALIDATION_ERROR_TYPE when errors can be related to input parameters.
 * For field-unspecific issues new type-triples can be added without setting validationErrors param.
 */
class ValidationError extends BusinessError {
	constructor({ type, title, defaultMessage }, validationErrors) {
		super({ type, title, defaultMessage }, undefined, validationErrors);
	}
}

/**
 * For Data Access Permission checks
 */
class ForbiddenError extends BusinessError {
	constructor(requestedResourceId, callerId) {
		super(FORBIDDEN_ERROR_TYPE, undefined, { requestedResourceId, callerId });
	}
}

/**
 * For brute force prevention
 */
class SilentError extends BusinessError {
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

module.exports = {
	ApplicationError,
	TechnicalError,
	BusinessError,
	InternalServerError,
	AssertionError,
	DocumentNotFound,
	SilentError,
	ValidationError,
	ForbiddenError,
};
