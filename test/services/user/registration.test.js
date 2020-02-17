const { expect } = require('chai');

const app = require('../../../src/app');
const accountModel = require('../../../src/services/account/model');
const { consentModel } = require('../../../src/services/consent/model');
const { userModel, registrationPinModel } = require('../../../src/services/user/model');
const { schoolModel } = require('../../../src/services/school/model');
const testObjects = require('../helpers/testObjects')(app);

const patchSchool = (system, schoolId) => schoolModel.findOneAndUpdate({ _id: schoolId }, {
	$push: {
		systems: system._id,
	},
}, { new: true }).lean().exec();

const createAccount = (system) => accountModel.create({
	lasttriedFailedLogin: '1970-01-01T00:00:00.000+0000',
	activated: false,
	username: 'fritz',
	password: '',
	systemId: system._id,
});

const createPin = (pin = 6716, email) => registrationPinModel.create({
	verified: false,
	email: email || `${Date.now()}@test.de`,
	pin,
});

describe('registration', () => {
	let account;
	let pin;
	let system;
	let userId = '';
	const { schoolId } = testObjects.options;

	it('sso registration should work', async () => {	
		system = await testObjects.createTestSystem();

		expect(system).to.exist;
		expect(system._id).to.exist;

		let school;
		[account, pin, school] = await Promise.all([
			createAccount(system),
			createPin(),
			patchSchool(system, schoolId),
		]);

		const sendData = {
			stage: 'on',
			classOrSchoolId: schoolId,
			roles: ['student'],
			sso: 'true',
			account: account._id,
			firstName: 'Vorname',
			lastName: 'Nachname',
			birthDate: '18.01.1991',
			email: pin.email,
			privacyConsent: 'true',
			termsOfUseConsent: 'true',
			pin: pin.pin,
			password_1: '',
			password_2: '',
			// _csrf: 'DqQU50jE-HoWzVInYTfVWqnwwWTt-Srxc8nc',
			schoolId,
		};

		const systemId = school.systems.find((s) => s._id.toString() === system._id.toString());
		expect(systemId).to.exist;

		const registrationData = await app.service('registration').create(sendData);
		expect(registrationData).to.exist;
		expect(registrationData.account).to.exist;
		expect(registrationData.consent).to.exist;
		expect(registrationData.parent).to.equal(null);
		expect(registrationData.user).to.exist;
		expect(registrationData.user._id).to.exist;

		expect(registrationData.account.userId).to.exist;
		expect(registrationData.account.activated).to.be.true;

		userId = registrationData.account.userId.toString();

		const [findAccount, findPin, findConsent, findUser] = await Promise.all([
			accountModel.find({ _id: account._id }).lean().exec(),
			registrationPinModel.find({ _id: pin._id }).lean().exec(),
			consentModel.find({ userId }).lean().exec(),
			userModel.find({ _id: userId }).lean().exec(),
		]);

		expect(findPin).to.be.an('array').to.has.lengthOf(0);
		expect(findAccount).to.be.an('array').to.has.lengthOf(1);
		expect(findConsent).to.be.an('array').to.has.lengthOf(1);
		expect(findUser).to.be.an('array').to.has.lengthOf(1);

		expect(findAccount[0].userId.toString()).to.equal(userId);
		expect(findAccount[0].activated).to.be.true;
	});

	after(() => Promise.all([
		testObjects.cleanup(),
		accountModel.deleteOne({ _id: account._id }).lean().exec(),
		// pin should already deleted, but if any error if throw it is save to clear it
		registrationPinModel.deleteOne({ _id: pin._id }).lean().exec(),
		consentModel.deleteOne({ userId }).lean().exec(),
		userModel.deleteOne({ _id: userId }).lean().exec(),
		schoolModel.findOneAndUpdate(
			{ _id: schoolId },
			{ $pull: { systems: system._id } },
		).lean().exec(),
	]));
});
