/**
 * This document contains common error types which set default values for given error types.
 * @see businessErrorTypes to define business rule based errors
 */

const INTERNAL_SERVER_ERROR = {
	type: 'INTERNAL_SERVER_ERROR',
	title: 'Internal Server Error',
	defaultMessage: 'An unexpected error occurred',
};

const ASSERTION_ERROR = {
	type: 'ASSERTION_ERROR',
	title: 'Assertion error',
	defaultMessage: 'Argument validation failed',
};
module.exports = {
	INTERNAL_SERVER_ERROR,
	ASSERTION_ERROR,
};
