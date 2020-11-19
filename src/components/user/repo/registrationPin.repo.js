
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

const deleteRegistrationPins = async (email, app) => {
	const registrationPins = await getRegistrationPins(email, app);
	registrationPins.forEach((registrationPin) => getService(app).remove(registrationPin));
};

module.exports = {
	getRegistrationPins,
	deleteRegistrationPins,
};
