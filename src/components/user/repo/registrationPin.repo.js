const { registrationPinModel } = require('../../../services/user/model');
const { deleteManyResult } = require('../../helper/repo.helper');
const { validateNotEmptyString } = require('../../helper/validation.helper');

const byEmailFilter = (email) => ({ email });

/**
 * Return pseudonyms for email
 * @param email
 */
const getRegistrationPinsByEmail = async (email) => {
	validateNotEmptyString({ email });
	return registrationPinModel.find(byEmailFilter(email)).lean().exec();
};

/**
 * Removes all registration pins for given email
 * @param {String|ObjectId} email
 */
const deleteRegistrationPinsByEmail = async (email) => {
	validateNotEmptyString({ email });
	const deleteResult = await registrationPinModel.deleteMany(byEmailFilter(email)).lean().exec();
	return deleteManyResult(deleteResult);
};

module.exports = {
	getRegistrationPinsByEmail,
	deleteRegistrationPinsByEmail,
};
