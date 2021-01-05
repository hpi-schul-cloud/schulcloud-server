const { registrationPinModel } = require('../../../services/user/model');
const { deleteManyResult } = require('../../helper/repo.helper');
const { validateEmail } = require('../../helper/uc.helper');

/**
 * Return pseudonyms for email
 * @param email
 */
const getRegistrationPinsForUser = async (email) => {
	validateEmail(email);
	return registrationPinModel.find({ email }).lean().exec();
};

/**
 * Removes all registration pins for given email
 * @param {String|ObjectId} email
 */
const deleteRegistrationPinsByEmail = async (email) => {
	validateEmail(email);
	const deleteResult = await registrationPinModel.deleteMany({ email }).lean().exec();
	return deleteManyResult(deleteResult);
};

module.exports = {
	getRegistrationPinsForUser,
	deleteRegistrationPinsByEmail,
};
