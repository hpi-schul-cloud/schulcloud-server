const { expect } = require('chai');
const assert = require('assert');
const moment = require('moment');

const appPromise = require('../../../src/app');
const { userModel } = require('../../../src/services/user/model');

const testObjects = require('../helpers/testObjects')(appPromise);

describe('registration service', () => {
	let server;
	let registrationService;
	let registrationPinService;
	let hashService;

	before((done) => {
		appPromise.then((app) => {
			registrationService = app.service('registration');
			registrationPinService = app.service('registrationPins');
			hashService = app.service('hash');
			server = app.listen(0, done);
		});
	});

	after(async () => {
		await server.close();
		await testObjects.cleanup();
	});

	it('registered the registration service', () => {
		assert.ok(registrationService);
	});

	it('processes registration by student correctly', async () => {
		const email = `max${Date.now()}@mustermann.de`;
		const importHash = `${Date.now()}`;
		await testObjects.createTestUser({
			importHash,
			email,
			firstName: 'Max',
			lastName: 'Mustermann',
			roles: 'student',
		});
		return registrationPinService
			.create({ email, silent: true })
			.then((registrationPin) => {
				const registrationInput = {
					classOrSchoolId: '5f2987e020834114b8efd6f8',
					pin: registrationPin.pin,
					importHash,
					password_1: 'Test123!',
					password_2: 'Test123!',
					birthDate: moment('15.10.1999', 'DD.MM.YYYY'),
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
			});
	});

	it('processes registration by parent correctly', async () => {
		const parentEmail = `moritz${Date.now()}@mustermann.de`;
		const email = `max${Date.now()}@mustermann.de`;
		const importHash = `${Date.now()}`;
		await testObjects.createTestUser({
			importHash,
			email: parentEmail,
			firstName: 'Max',
			lastName: 'Mustermann',
			roles: 'student',
		});
		return registrationPinService
			.create({ email: parentEmail, silent: true })
			.then((registrationPin) => {
				const registrationInput = {
					classOrSchoolId: '5f2987e020834114b8efd6f8',
					pin: registrationPin.pin,
					importHash,
					password_1: 'Test123!',
					password_2: 'Test123!',
					birthDate: moment('15.10.2014', 'DD.MM.YYYY'),
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
				expect(response.user.parents[0]).not.to.be.null;
				expect(response.account).to.have.property('_id');
			});
	});

	it('fails with invalid pin', async () => {
		const email = `max${Date.now()}@mustermann.de`;
		const importHash = `${Date.now()}`;
		await testObjects.createTestUser({
			importHash,
			email,
			firstName: 'Max',
			lastName: 'Mustermann',
			roles: 'student',
		});
		return registrationPinService
			.create({ email, silent: true })
			.then((registrationPin) => {
				let pin = Number(registrationPin.pin);
				pin = pin === 9999 ? 1000 : pin + 1;
				// make sure we pass a wrong pin
				return registrationService.create({
					classOrSchoolId: '5f2987e020834114b8efd6f8',
					pin: String(pin),
					importHash,
					birthDate: moment('15.10.1999', 'DD.MM.YYYY'),
					email,
					firstName: 'Max',
					lastName: 'Mustermann',
				});
			})
			.catch((err) => {
				expect(err).to.not.equal(undefined);
				expect(err.message).to.equal(
					'Der eingegebene Code konnte leider nicht verfiziert werden. Versuch es doch noch einmal.'
				);
			});
	});

	it('fails if parent and student email are the same', async () => {
		const currentTS = Date.now();
		const email = `max${currentTS}@mustermann.de`;
		const importHash = `${currentTS}`;
		await testObjects.createTestUser({
			importHash,
			email,
			firstName: 'Max',
			lastName: 'Mustermann',
		});
		registrationService
			.create({
				importHash,
				classOrSchoolId: '5f2987e020834114b8efd6f8',
				email,
				parent_email: email,
				birthDate: moment('18.02.2015', 'DD.MM.YYYY'),
			})
			.catch((err) => {
				expect(err.message).to.equal('Bitte gib eine unterschiedliche E-Mail-Adresse für dein Kind an.');
			});
	});

	it('fails if parent and student email are the same (case insensitive)', async () => {
		const currentTS = Date.now();
		const email = `max${currentTS}@mustermann.de`;
		const parentEmail = `MAX${currentTS}@mustermann.DE`;
		const importHash = `${currentTS}`;
		await testObjects.createTestUser({
			importHash,
			email,
			firstName: 'Max',
			lastName: 'Mustermann',
		});
		registrationService
			.create({
				importHash,
				classOrSchoolId: '5f2987e020834114b8efd6f8',
				email,
				parent_email: parentEmail,
				birthDate: moment('18.02.2015', 'DD.MM.YYYY'),
			})
			.catch((err) => {
				expect(err.message).to.equal('Bitte gib eine unterschiedliche E-Mail-Adresse für dein Kind an.');
			});
	});

	it('fails if user is trying to register with roles other than student/employee/expert', async () => {
		const email = `max${Date.now()}@mustermann.de`;
		let hash;
		let user;
		const hashData = {
			toHash: email,
			save: true,
		};
		return hashService
			.create(hashData)
			.then((newHash) => {
				hash = newHash;
				return testObjects.createTestUser({
					email,
					firstName: 'Max',
					lastName: 'Mustermann',
					schoolId: '5f2987e020834114b8efd6f8',
					roles: ['5b45f8d28c8dba65f8871e19'],
					importHash: hash,
				});
			})
			.then((newUser) => {
				user = newUser;
				return registrationPinService.create({ email, silent: true });
			})
			.then((registrationPin) => {
				const registrationInput = {
					classOrSchoolId: '5f2987e020834114b8efd6f8',
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
				return registrationService
					.create(registrationInput)
					.then(() => {
						throw new Error('should have failed');
					})
					.catch((err) => {
						expect(err.message).to.not.equal('should have failed');
						expect(err.message).to.equal('You are not allowed to register!');
					});
			});
	});

	it('succeed if user is trying to register with admin role', async () => {
		const email = `max${Date.now()}@mustermann.de`;
		let hash;
		let user;
		const hashData = {
			toHash: email,
			save: true,
		};
		return hashService
			.create(hashData)
			.then((newHash) => {
				hash = newHash;
				return testObjects.createTestUser({
					email,
					firstName: 'Max',
					lastName: 'Mustermann',
					schoolId: '5f2987e020834114b8efd6f8',
					roles: ['0000d186816abba584714c96'], // admin
					importHash: hash,
				});
			})
			.then((newUser) => {
				user = newUser;
				return registrationPinService.create({ email, silent: true });
			})
			.then((registrationPin) => {
				const registrationInput = {
					classOrSchoolId: '5f2987e020834114b8efd6f8',
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
				});
			});
	});

	it('undoes changes on fail', async () => {
		const email = `max${Date.now()}@mustermann.de`;
		const importHash = `${Date.now()}`;
		await testObjects.createTestUser({
			importHash,
			email,
			firstName: 'Max',
			lastName: 'Mustermann',
			roles: 'student',
		});
		const registrationPin = await registrationPinService.create({ email, silent: true });
		const registrationInput = {
			importHash,
			classOrSchoolId: '5f2987e020834114b8efd6f8',
			pin: registrationPin.pin,
			birthDate: moment('15.10.1999', 'DD.MM.YYYY'),
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
		return hashService
			.create(hashData)
			.then((newHash) => {
				hash = newHash;
				return testObjects.createTestUser({
					email,
					firstName: 'Max',
					lastName: 'Mustermann',
					schoolId: '5f2987e020834114b8efd6f8',
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
					classOrSchoolId: '5f2987e020834114b8efd6f8',
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
				});
			});
	});

	it('hashService returns a string', () => {
		const email = `max${Date.now()}@mustermann.de`;
		const hashData = {
			toHash: email,
			save: true,
			patchUser: true,
		};

		return (
			hashService
				.create(hashData)
				// eslint-disable-next-line promise/always-return
				.then((res) => {
					expect(res).to.be.a('string');
				})
				.catch(() => {})
		);
	});

	it('hashService returns bad request without toHash parameter', () => {
		const hashData = {
			save: true,
			patchUser: true,
		};

		return (
			hashService
				.create(hashData)
				// eslint-disable-next-line promise/always-return
				.then(() => {
					expect.fail('BadRequest: Please set toHash key.');
				})
				.catch((e) => {
					expect(e.type).to.equal('FeathersError');
					expect(e.className).to.equal('bad-request');
				})
		);
	});
});
