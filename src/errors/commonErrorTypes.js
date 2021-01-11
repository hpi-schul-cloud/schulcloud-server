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

const API_VALIDATION_ERROR_TYPE = {
	type: 'API_VALIDATION_ERROR',
	title: 'API Validation Error',
	defaultMessage: 'API Validation failed',
};

module.exports = {
	INTERNAL_SERVER_ERROR_TYPE,
	ASSERTION_ERROR_TYPE,
	API_VALIDATION_ERROR_TYPE,
};
