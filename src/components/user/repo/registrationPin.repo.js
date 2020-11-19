
const getService = (app) => {
	return app.service('registrationPins');
};

const getRegistrationPins = async (email, app) => {
	return getService(app).find({
		query: {
			email,
		},
		paginate: false,
	});
};

const deleteRegistrationPins = async (registrationPins, app) => {
	if (registrationPins._id) {
		getService(app).remove(registrationPins._id);
	}
	else if (registrationPins.length > 1) {
		registrationPins.forEach((registrationPin) => getService(app).remove(registrationPin._id));
	}
};

module.exports = {
	getRegistrationPins,
	deleteRegistrationPins,
};
