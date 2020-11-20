const getService = (app) => {
	return app.service('registrationPinsModel');
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
	const ids = registrationPins._id
		? [registrationPins._id]
		: registrationPins.map((registrationPin) => registrationPin._id);
	const removePromises = ids.map((id) => getService(app).remove(id));
	await Promise.all(removePromises);
};

module.exports = {
	find: getRegistrationPins,
	delete: deleteRegistrationPins,
};
