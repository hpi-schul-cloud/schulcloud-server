const { ValidationError } = require('../../errors');
const { isValid: isValidObjectId } = require('../../helper/compare').ObjectId;

const validateObjectId = (objectId) => {
	if (!isValidObjectId(objectId)) throw new ValidationError('a valid objectId is required', { objectId });
};

const validateEmail = (email) => {
	// eslint-disable-next-line no-useless-escape
	const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (!re.test(email)) throw new ValidationError('email is invalid', { email });
};

const trashBinResult = ({ scope, data, complete }) => {
	return { trashBinData: { scope, data }, complete };
};

module.exports = { validateObjectId, validateEmail, trashBinResult };
