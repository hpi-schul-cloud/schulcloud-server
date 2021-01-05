const { FeathersError } = require('@feathersjs/errors');
const { ApplicationError, SilentError } = require('./errors');

const isSilentError = (error) => error instanceof SilentError || (error && error.error instanceof SilentError); // TODO why checking error.error here
const isApplicationError = (error) => error instanceof ApplicationError;

const isFeathersError = (error) => error instanceof FeathersError;
const isUncaughtError = (error) => !isApplicationError(error) && !isFeathersError(error);

module.exports = {
	isSilentError,
	isApplicationError,
	isFeathersError,
	isUncaughtError,
};
