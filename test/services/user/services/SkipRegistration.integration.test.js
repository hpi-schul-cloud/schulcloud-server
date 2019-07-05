const { expect } = require('chai');

const app = require('../../../../src/app');

const testObjects = require('../../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../../helpers/services/login')(app);
const { create: createUser } = require('../../helpers/services/users')(app);

const skipRegistrationService = app.service('/users/:userid/skipregistration');

describe.only('SkipRegistration integration', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	it('fails without authorisation', async () => {
		const user = await testObjects.createTestUser({
			roles: ['student'],
		});
		const scenarioParams = {
			route: { userid: user._id },
			provider: 'rest',
		};

		try {
			await app.service('/users/:userid/skipregistration').create({
				parent_privacyConsent: true,
				parent_termsOfUseConsent: true,
				privacyConsent: true,
				termsOfUseConsent: true,
				birthday: '2014-12-19T00:00:00Z',
				password: 'password1',
			}, { route: { userid: user._id }, provider: 'rest' });
			throw new Error('should fail');
		} catch (err) {
			expect(err).to.not.equal('undefined');
			expect(err.code).to.equal(401);
			expect(err.message).to.equal('No auth token');
		}
	});

	it('fails for student trying to skip registrations', async () => {
		const targetUser = await testObjects.createTestUser({
			roles: ['student'],
		});
		const actingUser = await testObjects.createTestUser({
			roles: ['student'],
		});
		const scenarioParams = await generateRequestParamsFromUser(actingUser);
		scenarioParams.route = { userid: targetUser._id };

		try {
			await app.service('/users/:userid/skipregistration').create({
				parent_privacyConsent: true,
				parent_termsOfUseConsent: true,
				privacyConsent: true,
				termsOfUseConsent: true,
				birthday: '2014-12-19T00:00:00Z',
				password: 'password1',
			}, scenarioParams);
			throw new Error('should fail');
		} catch (err) {
			expect(err).to.not.equal('undefined');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal('you do not have permission to do this!');
		}
	});

	it('fails for teacher trying to skip teacher registrations', async () => {
		const targetUser = await testObjects.createTestUser({
			roles: ['teacher'],
		});
		const actingUser = await testObjects.createTestUser({
			roles: ['teacher'],
		});
		const scenarioParams = await generateRequestParamsFromUser(actingUser);
		scenarioParams.route = { userid: targetUser._id };

		try {
			await app.service('/users/:userid/skipregistration').create({
				parent_privacyConsent: true,
				parent_termsOfUseConsent: true,
				privacyConsent: true,
				termsOfUseConsent: true,
				password: 'password1',
			}, scenarioParams);
			throw new Error('should fail');
		} catch (err) {
			expect(err).to.not.equal('undefined');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal('you do not have permission to do this!');
		}
	});

	it('succeeds for teacher skipping student registration', async () => {
		let targetUser = await testObjects.createTestUser({
			roles: ['student'],
		});
		targetUser = await app.service('users').patch(targetUser._id, { importHash: 'someHash' });
		const actingUser = await testObjects.createTestUser({
			roles: ['teacher'],
		});
		const scenarioParams = await generateRequestParamsFromUser(actingUser);
		scenarioParams.route = { userid: targetUser._id };

		const result = await app.service('/users/:userid/skipregistration').create({
			parent_privacyConsent: true,
			parent_termsOfUseConsent: true,
			privacyConsent: true,
			termsOfUseConsent: true,
			birthday: '2014-12-19T00:00:00Z',
			password: 'password1',
		}, scenarioParams);
		expect(result).to.equal('success');
	});

	it('succeeds for admin skipping teacher registration', async () => {
		let targetUser = await testObjects.createTestUser({
			roles: ['teacher'],
		});
		targetUser = await app.service('users').patch(targetUser._id, { importHash: 'someHash' });
		const actingUser = await testObjects.createTestUser({
			roles: ['administrator'],
		});
		const scenarioParams = await generateRequestParamsFromUser(actingUser);
		scenarioParams.route = { userid: targetUser._id };

		const result = await app.service('/users/:userid/skipregistration').create({
			parent_privacyConsent: true,
			parent_termsOfUseConsent: true,
			privacyConsent: true,
			termsOfUseConsent: true,
			password: 'password1',
		}, scenarioParams);
		expect(result).to.equal('success');
	});

	it('succeeds for admin skipping student registration', async () => {
		let targetUser = await testObjects.createTestUser({
			roles: ['student'],
		});
		targetUser = await app.service('users').patch(targetUser._id, { importHash: 'someHash' });
		const actingUser = await testObjects.createTestUser({
			roles: ['administrator'],
		});
		const scenarioParams = await generateRequestParamsFromUser(actingUser);
		scenarioParams.route = { userid: targetUser._id };

		const result = await app.service('/users/:userid/skipregistration').create({
			parent_privacyConsent: true,
			parent_termsOfUseConsent: true,
			privacyConsent: true,
			termsOfUseConsent: true,
			birthday: '2014-12-19T00:00:00Z',
			password: 'password1',
		}, scenarioParams);
		expect(result).to.equal('success');
	});
});
