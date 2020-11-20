const getService = (app) => {
	return app.service('registrationPinsModel');
};

const getRegistrationPins = async (email, app) => {
	const registrationPins = await getService(app).find({
		query: {
			email,
		},
		paginate: false,
	});
	return Array.isArray(registrationPins) ? registrationPins : [registrationPins];
};

const deleteRegistrationPins = async (registrationPins, app) => {
	const ids = registrationPins.map((registrationPin) => registrationPin._id);
	const removePromises = ids.map((id) => getService(app).remove(id));
	await Promise.all(removePromises);
};

module.exports = {
	find: getRegistrationPins,
	delete: deleteRegistrationPins,
};
