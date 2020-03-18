const { expect } = require('chai');
const { Configuration } = require('@schul-cloud/commons');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const schoolSyncService = app.service('schools/:schoolId/messengerSync');

describe('messenger schoolSync Service', () => {
	let server;
	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
		testObjects.cleanup();
	});

	describe('with rabbitMQ enabled', () => {
		let configBefore;

		before(async () => {
			configBefore = Configuration.toObject(); // deep copy current config
			Configuration.set('FEATURE_RABBITMQ_ENABLED', true);
		});

		after(async () => {
			Configuration.parse(configBefore);
		});

		it('admin can trigger a schoolSync', async () => {
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
			const users = await Promise.all([
				testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id }),
				testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id }),
				testObjects.createTestUser({ roles: ['student'], schoolId: school._id }),
			]);
			const params = await testObjects.generateRequestParamsFromUser(users[0]);
			params.route = { schoolId: school._id.toString() };
			const result = await schoolSyncService.create({}, params);
			// todo: check rabbit Messages
		});
	});

	describe('with rabbitMQ disabled', () => {
		let configBefore;

		before(async () => {
			configBefore = Configuration.toObject(); // deep copy current config
			Configuration.set('FEATURE_RABBITMQ_ENABLED', false);
		});

		after(async () => {
			Configuration.parse(configBefore);
		});

		it('schoolSync responds with an error', async () => {
			this.app = app;
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
			const users = await Promise.all([
				testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id }),
			]);
			const params = await testObjects.generateRequestParamsFromUser(users[0]);
			params.route = { schoolId: school._id.toString() };
			try {
				const result = await schoolSyncService.create({}, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.eq('should have failed');
				expect(err.code).to.eq(500);
				expect(err.message).to.eq('feature not supported.');
			}
		});
	});
});
