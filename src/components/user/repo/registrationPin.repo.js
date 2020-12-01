const { registrationPinModel } = require('../../../services/user/model');
const { GeneralError } = require('../../../errors');

const getRegistrationPinsForUser = async (email) => {
	return registrationPinModel.find({ email }).lean().exec();
};

const deleteRegistrationPins = async (registrationPinIds) => {
	const deleteResult = await registrationPinModel
		.deleteMany({
			_id: {
				$in: registrationPinIds,
			},
		})
		.lean()
		.exec();
	if (deleteResult.n !== deleteResult.ok || deleteResult.ok !== registrationPinIds.length) {
		throw new GeneralError('db error during deleting registration pin');
	}
	return registrationPinIds;
};

const deleteRegistrationPinsByEmail = async (email) => {
	const registrationPins = getRegistrationPinsForUser(email);
	deleteRegistrationPins(registrationPins.map((registrationPin) => registrationPin._id));
	return registrationPins;
}

module.exports = {
	getRegistrationPinsForUser,
	deleteRegistrationPins,
	deleteRegistrationPinsByEmail,
};
