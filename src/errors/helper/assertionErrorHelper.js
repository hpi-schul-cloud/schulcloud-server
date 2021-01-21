const REQUIRED_PARAMENTER_MISSING = 'REQUIRED_PARAMENTER_MISSING';
const REQUIRED_PARAMETER_TO_BE_NON_EMPTY_STRING = 'REQUIRED_PARAMETER_TO_BE_NON_EMPTY_STRING';

/**
 * Transforms an options object into array of validation errors.
 * @param {Object} options of missing parameters
 * @returns {Array} of validation errors
 */
const missingParameters = (parameterNames) => {
	const validationErrors = Object.keys(parameterNames).map((key) => ({
		param: key,
		error: REQUIRED_PARAMENTER_MISSING,
	}));

	return validationErrors;
};

const requiredParametersToBeNonEmtyString = (parameterNames) => {
	const validationErrors = Object.keys(parameterNames).map((key) => ({
		param: key,
		error: REQUIRED_PARAMETER_TO_BE_NON_EMPTY_STRING,
	}));

	return validationErrors;
};

module.exports = {
	missingParameters,
	requiredParametersToBeNonEmtyString,
};
