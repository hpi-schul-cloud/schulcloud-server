const { registrationPinModel } = require('../../../services/user/model');
const { NotFound } = require('../../../errors');

const getRegistrationPins = async (email) => {
	const registrationPin = await registrationPinModel.findOne({ email }).lean().exec();
	if (registrationPin === null) {
		throw new NotFound('no registration pin for this user');
	}
	return registrationPin;
};

const deleteRegistrationPinForUser = async (email) => {
	const result = await registrationPinModel.findOneAndRemove({ email }).lean().exec();
	return result;
};

module.exports = {
	getRegistrationPin: getRegistrationPins,
	deleteRegistrationPinForUser
};
