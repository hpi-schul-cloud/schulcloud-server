const { registrationPinRepo } = require('../repo/index');

const deleteRegistrationPinsByEmail = async (email) => {
	return { complete: true, data: registrationPinRepo.deleteRegistrationPinsByEmail(email) };
};

module.exports = {
	deleteRegistrationPinsByEmail,
};
