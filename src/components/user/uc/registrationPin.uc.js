const { registrationPinRepo } = require('../repo/index');

const getRegistrationPinsForUser = async (email) => {
	return registrationPinRepo.getRegistrationPinsForUser(email);
};

const deleteRegistrationPins = async (pinIds) => {
	return registrationPinRepo.deleteRegistrationPins(pinIds);
};

module.exports = {
	getRegistrationPinsForUser,
	deleteRegistrationPins,
};
