const REQUIRED_PARAMETER_MISSING = 'REQUIRED_PARAMETER_MISSING';

/**
 * Transforms an options object into array of validation errors.
 * @param {Object} options of missing parameters
 * @returns {Array} of validation errors
 */
const missingParameters = (parameterNames) => {
	const validationErrors = Object.keys(parameterNames).map((key) => ({
		param: key,
		error: REQUIRED_PARAMETER_MISSING,
	}));

	return validationErrors;
};

module.exports = {
	missingParameters,
};
