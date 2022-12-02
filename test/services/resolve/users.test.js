const assert = require('assert');
const _ = require('lodash');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise());
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');

describe('resolve/users service', () => {
	let app;
	let service;
	let nestServices;
	let testUser;
	let testCourse;

	before(async () => {
		app = await appPromise();
		service = app.service('resolve/users');
		nestServices = await setupNestServices(app);
		testUser = await testObjects.createTestUser();
		testCourse = await testObjects.createTestCourse({ userIds: [testUser._id] });
	});

	after(async () => {
		testObjects.cleanup;
		await closeNestServices(nestServices);
	});

	it('registered the resolve/users service', () => {
		assert.ok(service);
	});

	it('get error if no scope is found', async () => {
		try {
			await service.get('00006e13b101c8742dc2d092');
			throw new Error('was not supposed to succeed');
		} catch (err) {
			assert(err.message.includes('No scope found for given id.'));
			assert(err.name === 'NotFound');
			assert(err.code === 404);
		}
	});

	it('return users if scope is found', () => {
		const data = service.get(testUser._id);
		assert(data.data.length > 0);
		assert(data.data[0].type === 'user');
		assert(_.find(data.data, (user) => user.id === testCourse._id));
	});
});
