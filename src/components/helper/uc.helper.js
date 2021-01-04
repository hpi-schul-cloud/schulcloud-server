const { ValidationError } = require('../../errors');
const { isValid: isValidObjectId } = require('../../helper/compare').ObjectId;

const validateObjectId = (objectId) => {
	if (!isValidObjectId(objectId)) throw new ValidationError('a valid objectId is required', { objectId });
};

const trashBinResult = ({ scope, data, complete }) => {
	return { trashBinData: { scope, data }, complete };
};

module.exports = { validateObjectId, trashBinResult };
