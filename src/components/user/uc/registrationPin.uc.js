const { registrationPinRepo } = require('../repo/index');
const { trashBinResult } = require('../../helper/uc.helper');
const { validateEmail } = require('../../helper/validation.helper');
const { debug } = require('../../../logger');

const deleteRegistrationPinsForUser = async (email) => {
	validateEmail(email);
	let complete = true;
	debug(`deleting user related registration pins started`, { email });
	const registrationPins = await registrationPinRepo.getRegistrationPinsForUser(email);
	debug(`found ${registrationPins.length} registration pins for the user to be removed`, { email });
	if (registrationPins.length !== 0) {
		const result = await registrationPinRepo.deleteRegistrationPinsByEmail(email);
		complete = result.success;
		debug(`removed  ${result.deletedDocuments} registration pins`, { email });
	}
	debug(`deleting user related registration pins finished`, { email });
	return trashBinResult({ scope: 'registrationPins', data: registrationPins, complete });
};

module.exports = {
	deleteRegistrationPinsForUser,
};
