const assert = require('assert');
const _ = require('lodash');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise());

describe('resolve/users service', () => {
	let app;
	let service;
	const testData = {};

	before(async () => {
		app = await appPromise();
		service = app.service('resolve/users');
		testData.user = await testObjects.createTestUser();
		testData.course = await testObjects.createTestCourse({ userIds: [testData.user._id] });
	});

	it('registered the resolve/users service', () => {
		assert.ok(service);
	});

	it('get error if no scope is found', () => {
		try {
			service.get('00006e13b101c8742dc2d092');
			throw new Error('was not supposed to succeed');
		} catch (err) {
			assert(err.message.includes('No scope found for given id.'));
			assert(err.name === 'NotFound');
			assert(err.code === 404);
		}
	});

	it('return users if scope is found', () => {
		const data = service.get(testData.user._id);
		assert(data.data.length > 0);
		assert(data.data[0].type === 'user');
		assert(_.find(data.data, (user) => user.id === testData.course._id));
	});
});
