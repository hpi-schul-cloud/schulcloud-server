const { Configuration } = require('@hpi-schul-cloud/commons');
const { expect } = require('chai');
const appPromise = require('../../../src/app');

const testObjects = require('../helpers/testObjects')(appPromise);

describe('school student list permission scenarios for ADMIN_TOGGLE_STUDENT_VISIBILITY', () => {
	describe('describe scenario for non-NBC/enabled', () => {
		let server;
		let app;
		let configBefore;

		before(async () => {
			configBefore = Configuration.toObject({});
			app = await appPromise;
			Configuration.set('ADMIN_TOGGLE_STUDENT_VISIBILITY', 'enabled');
			server = await app.listen(0);
		});

		after(async () => {
			Configuration.reset(configBefore);
			await server.close();
		});

		afterEach(async () => {
			await testObjects.cleanup();
		});

		it('should add default student list permission for non-NBC/enabled school', async () => {
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
		let configBefore;

		before(async () => {
			configBefore = Configuration.toObject({});
			app = await appPromise;
			Configuration.set('ADMIN_TOGGLE_STUDENT_VISIBILITY', 'disabled');
			server = await app.listen(0);
		});

		after(async () => {
			Configuration.reset(configBefore);
			await server.close();
		});

		afterEach(async () => {
			await testObjects.cleanup();
		});

		it('should not add default student list permission for disabled school', async () => {
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
	describe('describe scenario for NBC/opt-in', () => {
		let server;
		let app;
		let configBefore;

		before(async () => {
			configBefore = Configuration.toObject({});
			app = await appPromise;
			Configuration.set('ADMIN_TOGGLE_STUDENT_VISIBILITY', 'opt-in');
			server = await app.listen(0);
		});

		after(async () => {
			Configuration.reset(configBefore);
			await server.close();
		});

		afterEach(async () => {
			await testObjects.cleanup();
		});

		it('should not add default student list permission for NBC/opt-in school', async () => {
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
	describe('describe scenario for opt-out', () => {
		let server;
		let app;
		let configBefore;

		before(async () => {
			configBefore = Configuration.toObject({});
			app = await appPromise;
			Configuration.set('ADMIN_TOGGLE_STUDENT_VISIBILITY', 'opt-out');
			server = await app.listen(0);
		});

		after(async () => {
			Configuration.reset(configBefore);
			await server.close();
		});

		afterEach(async () => {
			await testObjects.cleanup();
		});

		it('should add default student list permission for opt-out school', async () => {
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
});
