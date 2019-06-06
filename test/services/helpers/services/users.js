let createdUserIds = [];
const tempPinIds = [];

const createTestUser = (app, opt) => ({
	// required fields for user
	firstName = 'Max',
	lastName = 'Mustermann',
	email = `max${Date.now()}@mustermann.de`,
	schoolId = opt.schoolId,
	accounts = [], // test if it has a effect
	roles = [],
	// manual cleanup, e.g. when testing delete:
	manualCleanup = false,
} = {}) => app.service('registrationPins').create({ email })
	.then((registrationPin) => {
		tempPinIds.push(registrationPin);
		return registrationPin;
	})
	.then(registrationPin => app.service('registrationPins').find({
		query: { pin: registrationPin.pin, email: registrationPin.email, verified: false },
	}))
	.then(() => app.service('users').create({
		firstName,
		lastName,
		email,
		schoolId,
		accounts,
		roles,
	}))
	.then((user) => {
		if (!manualCleanup) {
			createdUserIds.push(user._id.toString());
		}
		return user;
	});

const cleanup = app => () => {
	const ids = createdUserIds;
	createdUserIds = [];
	return ids.map(id => app.service('users').remove(id));
};

module.exports = (app, opt) => ({
	create: createTestUser(app, opt),
	cleanup: cleanup(app),
	info: createdUserIds,
	tempPinIds,
});
