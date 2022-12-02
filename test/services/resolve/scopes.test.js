const assert = require('assert');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise());
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');

describe('resolve/scopes service', () => {
	let app;
	let service;
	let nestServices;
	const testData = {};

	before(async () => {
		app = await appPromise();
		service = app.service('resolve/scopes');
		nestServices = await setupNestServices(app);
		testData.school = await testObjects.createTestSchool();
		testData.user = await testObjects.createTestUser({ schoolId: testData.school._id });
		testData.course = await testObjects.createTestCourse({
			schoolId: testData.school._id,
			userIds: [testData.user._id],
		});
		testData.admin = await testObjects.createTestUser({ roles: 'admin', schoolId: testData.school._id });
	});

	after(async () => {
		testObjects.cleanup;
		await closeNestServices(nestServices);
	});

	it('registered the resolve/scopes service', () => {
		assert.ok(service);
	});

	it('get error if id is no object id', () => {
		try {
			service.get('123');
			throw new Error('was not supposed to succeed');
		} catch (err) {
			assert(err.message.includes('Cast to ObjectId failed'));
			assert(err.name === 'BadRequest');
			assert(err.code === 400);
		}
	});

	it('get 404 if no user is found', () => {
		try {
			service.get('00006e13b101c8742dc2d092');
			throw new Error('was not supposed to succeed');
		} catch (err) {
			assert(err.message.includes('No record found for id'));
			assert(err.name === 'NotFound');
			assert(err.code === 404);
		}
	});

	it('return scopes if user is found', async () => {
		const data = await service.get(testData.user._id);
		assert(data.data.length > 0);
	});

	it('return courseAdmin scope if admin is found and his school has a course', async () => {
		const data = await service.get(testData.admin._id);
		const courseAdmin = data.data.filter(
			(scope) => scope.attributes.scopeType === 'courseAdmin' && scope.id === testData.course._id
		);
		assert(courseAdmin.length === 1);
	});
});
