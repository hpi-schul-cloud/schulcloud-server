const REQUIRED_PARAMENTER_MISSING = 'REQUIRED_PARAMENTER_MISSING';

/**
 * Transforms an options object into array of validation errors.
 * @param {Object} options of missing parameters
 * @returns {Array} of validation errors
 */
const missingParameters = (options) => {
	const validationErrors = Object.keys(options).map((key) => {
		return { param: key, error: REQUIRED_PARAMENTER_MISSING };
	});

	return validationErrors;
};

module.exports = {
	missingParameters,
};
