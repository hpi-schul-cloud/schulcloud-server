const { ValidationError } = require('../../errors');
const { isValid: isValidObjectId } = require('../../helper/compare').ObjectId;

const validateUserId = (userId) => {
	if (!isValidObjectId(userId)) throw new ValidationError('a valid objectId is required', { userId });
};

module.exports = { validateUserId };
