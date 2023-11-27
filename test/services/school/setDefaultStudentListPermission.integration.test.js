const { Configuration } = require('@hpi-schul-cloud/commons');
const { expect } = require('chai');
const appPromise = require('../../../src/app');

const testObjects = require('../helpers/testObjects')(appPromise());
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');

describe('school student list permission scenarios for TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT', () => {
	describe('scenario for enabled', () => {
		let server;
		let app;
		let nestServices;
		let configBefore;

		before(async () => {
			configBefore = Configuration.toObject({});
			app = await appPromise();
			Configuration.set('TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT', 'true');
			server = await app.listen(0);
			nestServices = await setupNestServices(app);
		});

		after(async () => {
			Configuration.reset(configBefore);
			await server.close();
			await closeNestServices(nestServices);
		});

		afterEach(async () => {
			await testObjects.cleanup();
		});

		it('should add default student list permission', async () => {
			const userSchool = await testObjects.createTestSchool();
			const superhero = await testObjects.createTestUser({
				schoolId: userSchool._id,
				roles: ['superhero'],
			});
			const data = {
				name: `${Date.now()} school`,
			};
			const params = await testObjects.generateRequestParamsFromUser(superhero);
			const school = await app.service('/schools').create(data, params);
			expect(school.permissions.teacher.STUDENT_LIST).to.eq(true);
		});
	});
	describe('describe scenario for disabled', () => {
		let server;
		let app;
		let nestServices;
		let configBefore;

		before(async () => {
			configBefore = Configuration.toObject({});
			app = await appPromise();
			nestServices = await setupNestServices(app);
			Configuration.set('TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT', 'false');
			server = await app.listen(0);
		});

		after(async () => {
			Configuration.reset(configBefore);
			await server.close();
		});

		afterEach(async () => {
			await testObjects.cleanup();
			await closeNestServices(nestServices);
		});

		it('should not add default student list permission', async () => {
			const userSchool = await testObjects.createTestSchool();
			const superhero = await testObjects.createTestUser({
				schoolId: userSchool._id,
				roles: ['superhero'],
			});
			const data = {
				name: `${Date.now()} school`,
			};
			const params = await testObjects.generateRequestParamsFromUser(superhero);
			const school = await app.service('/schools').create(data, params);
			expect(school.permissions).to.eq(undefined);
		});
	});
});
