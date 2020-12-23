const { ValidationError } = require('../../errors');
const { isValid: isValidObjectId } = require('../../helper/compare').ObjectId;

const validateObjectId = (objectId) => {
	if (!isValidObjectId(objectId)) throw new ValidationError('a valid objectId is required', { objectId });
};

module.exports = { validateObjectId };
