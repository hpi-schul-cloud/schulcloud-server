const { registrationPinModel } = require('../../../../src/services/user/model');

let createdUserIds = [];

const rnd = () => Math.round(Math.random() * 10000);

const createTestUser = (appPromise, opt) => async ({
	// required fields for user
	firstName = 'Max',
	lastName = 'Mustermann',
	birthday = undefined,
	email = `max${`${Date.now()}_${rnd()}`}@mustermann.de`,
	schoolId = opt.schoolId,
	accounts = [], // test if it has a effect
	roles = [],
	discoverable = undefined,
	firstLogin = false,
	// manual cleanup, e.g. when testing delete:
	manualCleanup = false,
	...otherParams
} = {}) => {
	const app = await appPromise;

	const user = await app.service('users').create({
		firstName,
		lastName,
		birthday,
		email,
		schoolId,
		accounts,
		roles,
		discoverable,
		preferences: {
			firstLogin,
		},
		...otherParams,
	});

	if (!manualCleanup) {
		createdUserIds.push(user._id.toString());
	}
	return user;
};

const cleanup = (appPromise) => async () => {
	const app = await appPromise;
	if (createdUserIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdUserIds;
	createdUserIds = [];
	const promises = ids.map((id) => app.service('users').remove(id));
	return Promise.all(promises);
};

module.exports = (app, opt) => ({
	create: createTestUser(app, opt),
	cleanup: cleanup(app),
	info: createdUserIds,
});
