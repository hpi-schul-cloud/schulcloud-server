const { registrationPinRepo } = require('../repo/index');

const getRegistrationPinsForUser = async (email) => {
	return registrationPinRepo.getRegistrationPinsForUser(email);
};

const deleteRegistrationPins = async (pinIds) => {
	return registrationPinRepo.deleteRegistrationPins(pinIds);
};

const deleteRegistrationPinsByEmail = async (email) => {
	return { complete: true, data: registrationPinRepo.deleteRegistrationPinsByEmail(email) };
};

module.exports = {
	getRegistrationPinsForUser,
	deleteRegistrationPins,
	deleteRegistrationPinsByEmail,
};
