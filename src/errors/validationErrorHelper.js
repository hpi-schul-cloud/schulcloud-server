const ARRAY_IS_EMPTY = 'ARRAY_IS_EMPTY';
const ARRAY_ESCEEDS_MAX_LENGTH = 'ARRAY_ESCEEDS_MAX_LENGTH';

const arrayShouldNotBeEmpty = (parameterNames) => {
	const validationErrors = Object.keys(parameterNames).map((key) => ({
		param: key,
		error: ARRAY_IS_EMPTY,
	}));

	return validationErrors;
};

const arrayShouldNotExceedLength = (parameterNames) => {
	const validationErrors = Object.keys(parameterNames).map((key) => ({
		param: key,
		error: ARRAY_ESCEEDS_MAX_LENGTH,
	}));

	return validationErrors;
};

module.exports = {
	arrayShouldNotBeEmpty,
	arrayShouldNotExceedLength,
};
