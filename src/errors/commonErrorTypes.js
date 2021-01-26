/**
 * This document contains common error types which set default values for given error types.
 * @see businessErrorTypes to define business rule based errors
 */

const INTERNAL_SERVER_ERROR_TYPE = {
	type: 'INTERNAL_SERVER_ERROR',
	title: 'Internal Server Error',
	defaultMessage: 'An unexpected error occurred',
};

const ASSERTION_ERROR_TYPE = {
	type: 'ASSERTION_ERROR',
	title: 'Assertion error',
	defaultMessage: 'Parameter validation error',
};

const VALIDATION_ERROR_TYPE = {
	type: 'VALIDATION_ERROR',
	title: 'Validation Error',
	defaultMessage: 'Validation failed',
};

const FORBIDDEN_ERROR_TYPE = {
	type: 'FORBIDDEN_ERROR',
	title: 'Access Denied',
	defaultMessage: 'Access Denied for the requested resource',
};

module.exports = {
	INTERNAL_SERVER_ERROR_TYPE,
	ASSERTION_ERROR_TYPE,
	VALIDATION_ERROR_TYPE,
	FORBIDDEN_ERROR_TYPE,
};
