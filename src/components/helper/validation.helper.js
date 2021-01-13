const { ValidationError } = require('../../errors');
const { isValid: isValidObjectId } = require('../../helper/compare').ObjectId;
const constants = require('../../utils/constants');

const validateObjectId = (objectId) => {
	if (!isValidObjectId(objectId)) throw new ValidationError('a valid objectId is required', { objectId });
};

const validateRequired = (...values) => {
	const hasNullOrUndefinedValues = values.some((v) => v === null || v === undefined);
	if (hasNullOrUndefinedValues) {
		throw new ValidationError('Required value is missing');
	}
};

const validateEmail = (email) => {
	if (!constants.expressions.email.test(email)) throw new ValidationError('email is invalid', { email });
};

module.exports = { validateObjectId, validateEmail, validateRequired };
