const { ValidationError } = require('../../errors');
const { isValid: isValidObjectId } = require('../../helper/compare').ObjectId;
const constants = require('../../utils/constants');

const isNullOrUndefined = (value) => value === null || value === undefined;

const hasNullOrUndefined = (values) => values.some((v) => isNullOrUndefined(v));

const hasEmpty = (values) => values.some((v) => v.length === 0);

const isValidEmail = (email) => constants.expressions.email.test(email);

const validateObjectId = (objectId) => {
	if (!isValidObjectId(objectId)) throw new ValidationError('a valid objectId is required', { objectId });
};

const validateNotNullOrUndefined = (...values) => {
	if (hasNullOrUndefined(values)) {
		throw new ValidationError('Required value is missing');
	}
};

const validateNotEmpty = (...values) => {
	if (hasNullOrUndefined(values) || hasEmpty(values)) {
		throw new ValidationError('Value cannot be empty');
	}
};

const validateEmail = (email) => {
	if (!isValidEmail(email)) throw new ValidationError('email is invalid', { email });
};

module.exports = { validateObjectId, validateEmail, validateNotNullOrUndefined, validateNotEmpty };
