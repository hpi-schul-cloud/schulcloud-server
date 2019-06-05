let createdUserIds = [];
const tempPinIds = [];

const createTestUser = (app, opt) => ({
	// required fields for user
	firstName = 'Max',
	lastName = 'Mustermann',
	birthday = undefined,
	email = `max${Date.now()}@mustermann.de`,
	schoolId = opt.schoolId,
	accounts = [], // test if it has a effect
	roles = [],
	discoverable = false,
	// manual cleanup, e.g. when testing delete:
	manualCleanup = false,
	consentStatus = 'missing',
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
		birthday,
		email,
		schoolId,
		accounts,
		roles,
		discoverable,
	}))
	.then((user) => {
		const consentPromises = [];
		if (consentStatus === 'parentsAgreed' && roles.includes('student')) {
			consentPromises.push(app.service('consents').create({
				userId: user._id,
				parentConsents: [{
					privacyConsent: true,
					termsOfUseConsent: true,
				}],
			}));
		} else if (consentStatus === 'ok') {
			consentPromises.push(app.service('consents').create({
				userId: user._id,
				userConsent: {
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
				},
				parentConsents: [{
					form: 'digital',
					privacyConsent: true,
					termsOfUseConsent: true,
				}],
			}));
		}
		return Promise.all(consentPromises).then(() => {
			if (!manualCleanup) {
				createdUserIds.push(user._id.toString());
			}
			return user;
		});
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
