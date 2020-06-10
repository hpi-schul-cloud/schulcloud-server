const { expect } = require('chai');
const assert = require('assert');

const app = require('../../../src/app');
const accountModel = require('../../../src/services/account/model');
const { consentModel } = require('../../../src/services/consent/model');
const { userModel, registrationPinModel } = require('../../../src/services/user/model');
const { schoolModel } = require('../../../src/services/school/model');

const registrationService = app.service('registration');
const registrationPinService = app.service('registrationPins');
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

describe('sso registration', () => {
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

describe('registration service', () => {
	after(async () => {
		await testObjects.cleanup();
	});

	it('registered the registration service', () => {
		assert.ok(registrationService);
	});

	it('processes registration by student correctly', async () => {
		const email = `max${Date.now()}@mustermann.de`;
		const importHash = `${Date.now()}`;
		await testObjects.createTestUser({
			importHash, email, firstName: 'Max', lastName: 'Mustermann',
		});
		return registrationPinService.create({ email, silent: true })
			.then((registrationPin) => {
				const registrationInput = {
					classOrSchoolId: '0000d186816abba584714c5f',
					pin: registrationPin.pin,
					importHash,
					password_1: 'Test123!',
					password_2: 'Test123!',
					birthDate: '15.10.1999',
					email,
					firstName: 'Max',
					lastName: 'Mustermann',
					privacyConsent: true,
					termsOfUseConsent: true,
				};
				return registrationService.create(registrationInput);
			})
			.then((response) => {
				expect(response.user).to.have.property('_id');
				expect(response.account).to.have.property('_id');
				expect(response.consent).to.have.property('_id');
				expect(response.consent).to.have.property('userConsent');
				expect(response.parent).to.equal(null);
			});
	});

	it('processes registration by parent correctly', async () => {
		const parentEmail = `moritz${Date.now()}@mustermann.de`;
		const email = `max${Date.now()}@mustermann.de`;
		const importHash = `${Date.now()}`;
		await testObjects.createTestUser({
			importHash, email: parentEmail, firstName: 'Max', lastName: 'Mustermann',
		});
		return registrationPinService.create({ email: parentEmail, silent: true })
			.then((registrationPin) => {
				const registrationInput = {
					classOrSchoolId: '0000d186816abba584714c5f',
					pin: registrationPin.pin,
					importHash,
					password_1: 'Test123!',
					password_2: 'Test123!',
					birthDate: '15.10.2014',
					email,
					firstName: 'Max',
					lastName: 'Mustermann',
					privacyConsent: true,
					termsOfUseConsent: true,
					parent_email: parentEmail,
					parent_firstName: 'Moritz',
					parent_lastName: 'Mustermann',
				};
				return registrationService.create(registrationInput);
			})
			.then((response) => {
				expect(response.user).to.have.property('_id');
				expect(response.consent).to.have.property('_id');
				expect(response.consent.parentConsents.length).to.be.at.least(1);
				expect(response.parent).to.have.property('_id');
				expect(response.user.parents[0].toString()).to.equal(response.parent._id.toString());
				expect(response.parent.children[0].toString()).to.include(response.user._id.toString());
				expect(response.account).to.have.property('_id');
			});
	});

	it('fails with invalid pin', async () => {
		const email = `max${Date.now()}@mustermann.de`;
		const importHash = `${Date.now()}`;
		await testObjects.createTestUser({
			importHash, email, firstName: 'Max', lastName: 'Mustermann',
		});
		return registrationPinService.create({ email, silent: true })
			.then((registrationPin) => {
				let pin = Number(registrationPin.pin);
				pin = pin === 9999 ? 1000 : pin + 1;
				// make sure we pass a wrong pin
				return registrationService.create({
					classOrSchoolId: '0000d186816abba584714c5f',
					pin: String(pin),
					importHash,
					birthDate: '15.10.1999',
					email,
					firstName: 'Max',
					lastName: 'Mustermann',
				});
			}).catch((err) => {
				expect(err).to.not.equal(undefined);
				expect(err.message).to.equal(
					'Der eingegebene Code konnte leider nicht verfiziert werden. Versuch es doch noch einmal.',
				);
			});
	});

	it('fails if parent and student email are the same', async () => {
		const email = `max${Date.now()}@mustermann.de`;
		const importHash = `${Date.now()}`;
		await testObjects.createTestUser({
			importHash, email, firstName: 'Max', lastName: 'Mustermann',
		});
		registrationService.create({
			importHash,
			classOrSchoolId: '0000d186816abba584714c5f',
			email,
			parent_email: email,
			birthDate: '18.02.2015',
		}).catch((err) => {
			expect(err.message).to.equal('Bitte gib eine unterschiedliche E-Mail-Adresse für dein Kind an.');
		});
	});

	it('undoes changes on fail', async () => {
		const email = `max${Date.now()}@mustermann.de`;
		const importHash = `${Date.now()}`;
		await testObjects.createTestUser({
			importHash, email, firstName: 'Max', lastName: 'Mustermann',
		});
		const registrationPin = await registrationPinService.create({ email, silent: true });
		const registrationInput = {
			importHash,
			classOrSchoolId: '0000d186816abba584714c5f',
			pin: registrationPin.pin,
			birthDate: '15.10.1999',
			email,
			firstName: 'Max',
			lastName: 'Mustermann',
			privacyConsent: true,
			termsOfUseConsent: true,
		};
		try {
			await registrationService.create(registrationInput);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			// no password given, should result in an error.
			expect(err.message).to.equal('Fehler beim Erstellen des Accounts.');
			// the user should not have been modified during the attempt
			const userCheck = await userModel.findOne({ email });
			expect(userCheck.birthday).to.equal(undefined);
			expect(userCheck.importHash).to.equal(importHash);
		}
	});

	it('processes teachers correctly', () => {
		const email = `max${Date.now()}@mustermann.de`;
		let hash;
		let user;
		const hashData = {
			toHash: email,
			save: true,
		};
		return app.service('hash').create(hashData)
			.then((newHash) => {
				hash = newHash;
				return userModel.create({
					email,
					firstName: 'Max',
					lastName: 'Mustermann',
					schoolId: '0000d186816abba584714c5f',
					roles: ['0000d186816abba584714c98'], // teacher
					importHash: hash,
				});
			})
			.then((newUser) => {
				user = newUser;
				return registrationPinService.create({ email, silent: true });
			})
			.then((registrationPin) => {
				const registrationInput = {
					classOrSchoolId: '0000d186816abba584714c5f',
					pin: registrationPin.pin,
					password_1: 'Test123!',
					password_2: 'Test123!',
					email,
					firstName: 'Max',
					lastName: 'Mustermann',
					importHash: hash,
					userId: user._id,
					privacyConsent: true,
					termsOfUseConsent: true,
				};
				return registrationService.create(registrationInput).then((response) => {
					expect(response.user).to.have.property('_id');
					expect(response.account).to.have.property('_id');
					expect(response.consent).to.have.property('_id');
					expect(response.consent).to.have.property('userConsent');
					expect(response.parent).to.equal(null);
				});
			});
	});
});
