const { expect } = require('chai');
const commons = require('@hpi-schul-cloud/commons');
const { ForbiddenError } = require('../../../../src/errors/applicationErrors');

const { Configuration } = commons;

const createRequestParamsForAdmin = async (testObjects, schoolFeatures) => {
	const school = await testObjects.createTestSchool({ features: schoolFeatures });
	const adminUser = await testObjects.createTestUser({ roles: ['administrator'], schoolId: school._id });

	const params = await testObjects.generateRequestParamsFromUser(adminUser);
	params.route = { schoolId: school._id.toString() };
	return params;
};

describe('MessengerConfigService', function test() {
	this.timeout(30000);
	let configBefore;
	let app;
	let server;
	let schoolServiceListeners;
	let testObjects;

	describe('if Matrix messenger is enabled', () => {
		before(async () => {
			configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
			Configuration.set('FEATURE_RABBITMQ_ENABLED', true);
			Configuration.set('FEATURE_MATRIX_MESSENGER_ENABLED', true);
			delete require.cache[require.resolve('../../../../src/app')];
			// eslint-disable-next-line global-require
			app = await require('../../../../src/app');
			// eslint-disable-next-line global-require
			testObjects = require('../../helpers/testObjects')(app);
			server = await app.listen(0);
			schoolServiceListeners = app.service('schools').listeners();
			app.service('schools').removeAllListeners();
		});

		after(async () => {
			Configuration.reset(configBefore);
			app.service('schools').listeners(schoolServiceListeners);
			await testObjects.cleanup();
			await server.close();
		});

		it('administrators can get messenger config', async () => {
			const params = await createRequestParamsForAdmin(testObjects, ['messenger']);
			const result = await app.service('schools/:schoolId/messenger').find(params);
			expect(result.messenger).to.be.true;
			expect(result.messengerSchoolRoom).to.be.false;
		});

		it('administrators can activate messenger', async () => {
			const params = await createRequestParamsForAdmin(testObjects, []);
			const result = await app.service('schools/:schoolId/messenger').patch(null, { messenger: true }, params);
			expect(result.messenger).to.be.true;
			expect(result.messengerSchoolRoom).to.be.false;
		});

		it('administrators can deactivate messenger', async () => {
			const params = await createRequestParamsForAdmin(testObjects, ['messenger']);

			const result = await app.service('schools/:schoolId/messenger').patch(null, { messenger: false }, params);
			expect(result.messenger).to.be.false;
			expect(result.messengerSchoolRoom).to.be.false;
		});

		it('administrators can patch messenger with same values', async () => {
			const params = await createRequestParamsForAdmin(testObjects, ['messenger']);

			const result = await app.service('schools/:schoolId/messenger').patch(null, { messenger: true }, params);
			expect(result.messenger).to.be.true;
			expect(result.messengerSchoolRoom).to.be.false;
		});

		it('administrators can activate messenger with options', async () => {
			const params = await createRequestParamsForAdmin(testObjects, []);

			const result = await app
				.service('schools/:schoolId/messenger')
				.patch(null, { messenger: true, messengerSchoolRoom: true }, params);
			expect(result.messenger).to.be.true;
			expect(result.messengerSchoolRoom).to.be.true;
		});

		it('administrators can activate and deactivate messenger options simultaneous', async () => {
			const params = await createRequestParamsForAdmin(testObjects, ['messengerSchoolRoom']);

			const result = await app
				.service('schools/:schoolId/messenger')
				.patch(null, { messenger: true, messengerSchoolRoom: false }, params);
			expect(result.messenger).to.be.true;
			expect(result.messengerSchoolRoom).to.be.false;
		});

		it('students can not activate messenger', async () => {
			const school = await testObjects.createTestSchool();
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });

			const params = await testObjects.generateRequestParamsFromUser(student);
			params.route = { schoolId: school._id.toString() };

			try {
				await app.service('schools/:schoolId/messenger').patch(null, { messenger: true }, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
			}
		});

		it('administrators from other schools can not activate messenger', async () => {
			const school = await testObjects.createTestSchool();
			const otherSchool = await testObjects.createTestSchool();
			const adminUser = await testObjects.createTestUser({ roles: ['administrator'], schoolId: otherSchool._id });

			const params = await testObjects.generateRequestParamsFromUser(adminUser);
			params.route = { schoolId: school._id.toString() };

			try {
				await app.service('schools/:schoolId/messenger').patch(null, { messenger: true }, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
			}
		});
	});

	describe('if Matrix messenger is disabled', () => {
		before(async () => {
			configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
			Configuration.set('FEATURE_MATRIX_MESSENGER_ENABLED', false);
			delete require.cache[require.resolve('../../../../src/app')];
			// eslint-disable-next-line global-require
			app = await require('../../../../src/app');
			// eslint-disable-next-line global-require
			server = await app.listen(0);
		});

		after(async () => {
			Configuration.reset(configBefore);
			await server.close();
		});

		it('the service is not exposed', async () => {
			expect(app.service('schools/:schoolId/messenger').find()).to.be.rejectedWith(ForbiddenError);
			expect(app.service('schools/:schoolId/messenger').patch()).to.be.rejectedWith(ForbiddenError);
		});
	});
});
