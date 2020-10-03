const { errorsByCode } = require('./errors');

const isFeatherError = (error) => error.type === 'FeathersError';

const convertToFeathersError = (error) => {
	if (isFeatherError(error)) {
		return error;
	}
	const code = error.code || error.statusCode || 500;
	return new errorsByCode[code](error);
};

module.exports = {
	isFeatherError,
	convertToFeathersError,
};
