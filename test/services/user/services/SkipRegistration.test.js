const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const skipRegistrationService = app.service('/users/:userid/skipregistration');

describe('skipRegistration service', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	it('registered the users service', () => {
		expect(skipRegistrationService).to.not.equal(undefined);
	});

	it('fails if user is missing importhash', async () => {
		const user = await testObjects.createTestUser({
			roles: ['student'],
		});
		try {
			await skipRegistrationService.create({
				parent_privacyConsent: true,
				parent_termsOfUseConsent: true,
				privacyConsent: true,
				termsOfUseConsent: true,
				birthday: '2014-12-19T00:00:00Z',
				password: 'password1',
			}, { route: { userid: user._id } });
			throw new Error('should fail');
		} catch (err) {
			expect(err).to.not.equal('undefined');
			expect(err.code).to.equal(400);
			expect(err.message).to.equal('this user is not viable for registration');
		}
	});

	it('fails if student doesnt get a birthdate', async () => {
		let user = await testObjects.createTestUser({
			roles: ['student'],
		});
		user = await app.service('users').patch(user._id, { importHash: 'someHash' });
		try {
			await skipRegistrationService.create({
				parent_privacyConsent: true,
				parent_termsOfUseConsent: true,
				privacyConsent: true,
				termsOfUseConsent: true,
				password: 'password1',
			}, { route: { userid: user._id } });
			throw new Error('should fail');
		} catch (err) {
			expect(err).to.not.equal('undefined');
			expect(err.code).to.equal(400);
			expect(err.message).to.equal('students require a birthdate');
		}
	});

	it('teacher does not need a birthdate', async () => {
		let user = await testObjects.createTestUser({
			roles: ['teacher'],
		});
		user = await app.service('users').patch(user._id, { importHash: 'someHash' });
		const result = await skipRegistrationService.create({
			parent_privacyConsent: true,
			parent_termsOfUseConsent: true,
			privacyConsent: true,
			termsOfUseConsent: true,
			password: 'password1',
		}, { route: { userid: user._id } });
		expect(result).to.equal('success');
	});

	it('fails without password', async () => {
		let user = await testObjects.createTestUser({
			roles: ['student'],
		});
		user = await app.service('users').patch(user._id, { importHash: 'someHash' });
		try {
			await skipRegistrationService.create({
				parent_privacyConsent: true,
				parent_termsOfUseConsent: true,
				privacyConsent: true,
				termsOfUseConsent: true,
				birthday: '2014-12-19T00:00:00Z',
			}, { route: { userid: user._id } });
			throw new Error('should fail');
		} catch (err) {
			expect(err).to.not.equal('undefined');
			expect(err.code).to.equal(400);
			expect(err.message).to.equal('you have to set a password!');
		}
	});

	it('fails without consents', async () => {
		let user = await testObjects.createTestUser({
			roles: ['student'],
		});
		user = await app.service('users').patch(user._id, { importHash: 'someHash' });
		try {
			await skipRegistrationService.create({
				birthday: '2014-12-19T00:00:00Z',
				password: 'password1',
			}, { route: { userid: user._id } });
			throw new Error('should fail');
		} catch (err) {
			expect(err).to.not.equal('undefined');
			expect(err.code).to.equal(400);
			expect(err.message).to.equal('you have to set valid consents!');
		}
	});

	it('correctly creates an account', async () => {
		let user = await testObjects.createTestUser({
			roles: ['student'],
		});
		user = await app.service('users').patch(user._id, { importHash: 'someHash' });
		await skipRegistrationService.create({
			parent_privacyConsent: true,
			parent_termsOfUseConsent: true,
			privacyConsent: true,
			termsOfUseConsent: true,
			birthday: '2014-12-19T00:00:00Z',
			password: 'password1',
		}, { route: { userid: user._id } });
		const accountResult = await app.service('accounts').find({ query: { userId: user._id } });
		expect(accountResult).to.not.equal(undefined);
		expect(accountResult.length).to.equal(1);
		const account = accountResult[0];
		expect(account.activated).to.equal(true);
		expect(account.password).to.not.equal(undefined);
	});

	it('correctly creates a consent', async () => {
		let user = await testObjects.createTestUser({
			roles: ['student'],
		});
		user = await app.service('users').patch(user._id, { importHash: 'someHash' });
		await skipRegistrationService.create({
			parent_privacyConsent: true,
			parent_termsOfUseConsent: true,
			privacyConsent: true,
			termsOfUseConsent: true,
			birthday: '2014-12-19T00:00:00Z',
			password: 'password1',
		}, { route: { userid: user._id } });
		const consentsResult = await app.service('consents').find({ query: { userId: user._id } });
		expect(consentsResult).to.not.equal(undefined);
		expect(consentsResult.total).to.equal(1);
		const consent = consentsResult.data[0];
		expect(consent.userConsent).to.not.equal(undefined);
		expect(consent.userConsent.form).to.equal('analog');
		expect(consent.userConsent.privacyConsent).to.equal(true);
		expect(consent.userConsent.termsOfUseConsent).to.equal(true);
		expect(consent.parentConsents[0]).to.not.equal(undefined);
		expect(consent.parentConsents[0].form).to.equal('analog');
		expect(consent.parentConsents[0].privacyConsent).to.equal(true);
		expect(consent.parentConsents[0].termsOfUseConsent).to.equal(true);
	});

	it('correctly updates the user', async () => {
		let user = await testObjects.createTestUser({
			roles: ['student'],
		});
		user = await app.service('users').patch(user._id, { importHash: 'someHash' });
		await skipRegistrationService.create({
			parent_privacyConsent: true,
			parent_termsOfUseConsent: true,
			privacyConsent: true,
			termsOfUseConsent: true,
			birthday: '2014-12-19T00:00:00Z',
			password: 'password1',
		}, { route: { userid: user._id } });
		user = await app.service('users').get(user._id);
		expect(user).to.not.equal(undefined);
		const date = new Date('2014-12-19T00:00:00Z');
		expect(user.birthday.toDateString()).to.equal(date.toDateString());
		expect(user.importHash).to.equal(undefined);
	});

	after(async () => {
		await testObjects.cleanup();
	});
});
