const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise());
const { BadRequest } = require('../../../../src/errors');
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('course share service', () => {
	let app;
	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	describe('getShareToken', () => {
		it('it should retrieve name of a course', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const shareToken = '1234567890';
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({ shareToken });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = { shareToken };

			const result = await app.service('/courses-share').find(params);

			expect(result).to.equal(course.name);
		});

		it('it should throw when called without sharetoken', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const params = await testObjects.generateRequestParamsFromUser(teacher);

			try {
				await app.service('/courses-share').find(params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
			}
		});

		it('it should throw not found when no course with sharetoken exists', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const shareToken = 'thisdoesntexist';
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = { shareToken };

			try {
				await app.service('/courses-share').find(params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err).to.be.instanceOf(BadRequest);
			}
		});
	});
});
