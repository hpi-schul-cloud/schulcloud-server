const { FeathersError } = require('@feathersjs/errors');
const { ApplicationError } = require('./errors');

const isApplicationError = (error) => error instanceof ApplicationError;
const isFeathersError = (error) => error instanceof FeathersError;
const isUncaughtError = (error) => !isApplicationError(error) && !isFeathersError(error);

module.exports = {
	isUncaughtError,
	isApplicationError,
	isFeathersError,
};
