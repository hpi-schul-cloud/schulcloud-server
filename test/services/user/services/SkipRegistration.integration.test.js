const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise());
const { generateRequestParamsFromUser } = require('../../helpers/services/login')(appPromise());
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');

describe('SkipRegistration integration', () => {
	let app;
	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await server.close();
		await closeNestServices(nestServices);
	});

	describe('route for single user', () => {
		it('fails without authorisation', async () => {
			const user = await testObjects.createTestUser({
				roles: ['student'],
			});

			try {
				await app.service('/users/:userId/skipregistration').create(
					{
						parent_privacyConsent: true,
						parent_termsOfUseConsent: true,
						privacyConsent: true,
						termsOfUseConsent: true,
						birthday: '2014-12-19T00:00:00Z',
						password: 'password1',
					},
					{ route: { userId: user._id }, provider: 'rest' }
				);
				throw new Error('should fail');
			} catch (err) {
				expect(err).to.not.equal('undefined');
				expect(err.code).to.equal(401);
				expect(err.message).to.equal('Not authenticated');
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
			scenarioParams.route = { userId: targetUser._id };

			try {
				await app.service('/users/:userId/skipregistration').create(
					{
						parent_privacyConsent: true,
						parent_termsOfUseConsent: true,
						privacyConsent: true,
						termsOfUseConsent: true,
						birthday: '2014-12-19T00:00:00Z',
						password: 'password1',
					},
					scenarioParams
				);
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
			scenarioParams.route = { userId: targetUser._id };

			try {
				await app.service('/users/:userId/skipregistration').create(
					{
						parent_privacyConsent: true,
						parent_termsOfUseConsent: true,
						privacyConsent: true,
						termsOfUseConsent: true,
						password: 'password1',
					},
					scenarioParams
				);
				throw new Error('should fail');
			} catch (err) {
				expect(err).to.not.equal('undefined');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal('you do not have permission to do this!');
			}
		});

		it('fails for user on different schools', async () => {
			const usersSchool = await testObjects.createTestSchool();
			const differentSchool = await testObjects.createTestSchool();
			const targetUser = await testObjects.createTestUser({
				roles: ['student'],
				schoolId: differentSchool._id,
			});
			const actingUser = await testObjects.createTestUser({
				roles: ['teacher'],
				schoolId: usersSchool._id,
			});
			const scenarioParams = await generateRequestParamsFromUser(actingUser);
			scenarioParams.route = { userId: targetUser._id };

			try {
				await app.service('/users/:userId/skipregistration').create(
					{
						parent_privacyConsent: true,
						parent_termsOfUseConsent: true,
						privacyConsent: true,
						termsOfUseConsent: true,
						birthday: '2014-12-19T00:00:00Z',
						password: 'password1',
					},
					scenarioParams
				);
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
			scenarioParams.route = { userId: targetUser._id };

			const result = await app.service('/users/:userId/skipregistration').create(
				{
					parent_privacyConsent: true,
					parent_termsOfUseConsent: true,
					privacyConsent: true,
					termsOfUseConsent: true,
					birthday: '2014-12-19T00:00:00Z',
					password: 'Password1!',
				},
				scenarioParams
			);
			expect(result).to.equal('success');
		}).timeout(6000);

		it('succeeds for admin skipping teacher registration', async () => {
			let targetUser = await testObjects.createTestUser({
				roles: ['teacher'],
			});
			targetUser = await app.service('users').patch(targetUser._id, { importHash: 'someHash' });
			const actingUser = await testObjects.createTestUser({
				roles: ['administrator'],
			});
			const scenarioParams = await generateRequestParamsFromUser(actingUser);
			scenarioParams.route = { userId: targetUser._id };

			const result = await app.service('/users/:userId/skipregistration').create(
				{
					parent_privacyConsent: true,
					parent_termsOfUseConsent: true,
					privacyConsent: true,
					termsOfUseConsent: true,
					password: 'Password1!',
				},
				scenarioParams
			);
			expect(result).to.equal('success');
		}).timeout(6000);

		it('succeeds for admin skipping student registration', async () => {
			let targetUser = await testObjects.createTestUser({
				roles: ['student'],
			});
			targetUser = await app.service('users').patch(targetUser._id, { importHash: 'someHash' });
			const actingUser = await testObjects.createTestUser({
				roles: ['administrator'],
			});
			const scenarioParams = await generateRequestParamsFromUser(actingUser);
			scenarioParams.route = { userId: targetUser._id };

			const result = await app.service('/users/:userId/skipregistration').create(
				{
					parent_privacyConsent: true,
					parent_termsOfUseConsent: true,
					privacyConsent: true,
					termsOfUseConsent: true,
					birthday: '2014-12-19T00:00:00Z',
					password: 'Password1!',
				},
				scenarioParams
			);
			expect(result).to.equal('success');
		}).timeout(6000);
	});

	describe('route for multiple users', () => {
		it('fails without authorisation', async () => {
			const user = await testObjects.createTestUser({
				roles: ['student'],
			});

			try {
				await app.service('/users/skipregistration').create(
					{
						dataObjects: [
							{
								userId: user._id,
								parent_privacyConsent: true,
								parent_termsOfUseConsent: true,
								privacyConsent: true,
								termsOfUseConsent: true,
								birthday: '2014-12-19T00:00:00Z',
								password: 'password1',
							},
						],
					},
					{ provider: 'rest' }
				);
				throw new Error('should fail');
			} catch (err) {
				expect(err).to.not.equal('undefined');
				expect(err.code).to.equal(401);
				expect(err.message).to.equal('Not authenticated');
			}
		});
	});

	it('fails for teacher', async () => {
		const targetUser = await testObjects.createTestUser({
			roles: ['student'],
		});
		const actingUser = await testObjects.createTestUser({
			roles: ['teacher'],
		});
		const scenarioParams = await generateRequestParamsFromUser(actingUser);

		try {
			await app.service('/users/skipregistration').create(
				{
					dataObjects: [
						{
							userId: targetUser._id,
							parent_privacyConsent: true,
							parent_termsOfUseConsent: true,
							privacyConsent: true,
							termsOfUseConsent: true,
							birthday: '2014-12-19T00:00:00Z',
							password: 'password1',
						},
					],
				},
				scenarioParams
			);
			throw new Error('should fail');
		} catch (err) {
			expect(err).to.not.equal('undefined');
			expect(err.code).to.equal(403);
			expect(err.message).to.equal("You don't have one of the permissions: ADMIN_VIEW.");
		}
	});

	it('succeeds for admin', async () => {
		const [targetUserOne, targetUserTwo, actingUser] = await Promise.all([
			testObjects
				.createTestUser({ roles: ['student'] })
				.then((u) => app.service('users').patch(u._id, { importHash: 'someHash' })),
			testObjects
				.createTestUser({ roles: ['student'] })
				.then((u) => app.service('users').patch(u._id, { importHash: 'someHash' })),
			testObjects.createTestUser({ roles: ['administrator'] }),
		]);
		const scenarioParams = await generateRequestParamsFromUser(actingUser);

		const result = await app.service('/users/skipregistration').create(
			{
				dataObjects: [
					{
						userId: targetUserOne._id,
						parent_privacyConsent: true,
						parent_termsOfUseConsent: true,
						privacyConsent: true,
						termsOfUseConsent: true,
						birthday: '2014-12-19T00:00:00Z',
						password: 'Password1!',
					},
					{
						userId: targetUserTwo._id,
						parent_privacyConsent: true,
						parent_termsOfUseConsent: true,
						privacyConsent: true,
						termsOfUseConsent: true,
						birthday: '2014-12-19T00:00:00Z',
						password: 'Password1!',
					},
				],
			},
			scenarioParams
		);
		expect(Array.isArray(result)).to.equal(true);
		expect(result[0].success).to.equal(true);
		expect(result[1].success).to.eq(true);
	}).timeout(6000);
});
