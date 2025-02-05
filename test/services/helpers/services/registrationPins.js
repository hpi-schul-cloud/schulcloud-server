const logger = require('../../../../src/logger/index');

let createdregistrationPinsIds = [];

// should rewrite
const createTestRegistrationPin = (appPromise) => async (registrationPinParameters, user) => {
	const app = await appPromise;
	registrationPinParameters.email = user.email;
	return app
		.service('registrationPinsModel')
		.create(registrationPinParameters)
		.then((registrationPin) => {
			createdregistrationPinsIds.push(registrationPin._id.toString());
			return registrationPin;
		});
};

const cleanup = (appPromise) => async () => {
	const app = await appPromise;
	if (createdregistrationPinsIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdregistrationPinsIds;
	createdregistrationPinsIds = [];
	return ids.map((id) => app.service('registrationPinsModel').remove(id));
};

const removeRegistraionPinPointer = (id) => {
	const index = createdregistrationPinsIds.indexOf(id);
	if (index > -1) {
		createdregistrationPinsIds.splice(index, 1);
	} else {
		logger.warning(`TestObject: No pointer with ${id} found.`);
	}
};

module.exports = (app, opt) => {
	return {
		create: createTestRegistrationPin(app, opt),
		cleanup: cleanup(app),
		info: createdregistrationPinsIds,
		removePointer: removeRegistraionPinPointer,
	};
};
