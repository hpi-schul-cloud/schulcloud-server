const { expect } = require('chai');
const assert = require('assert');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise());
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');

describe('resolve/scopes service', () => {
	let app;
	let service;
	let nestServices;
	let testSchool;
	let testUser;
	let testCourse;
	let testAdmin;

	before(async () => {
		app = await appPromise();
		service = app.service('resolve/scopes');
		nestServices = await setupNestServices(app);
		testSchool = await testObjects.createTestSchool();
		testUser = await testObjects.createTestUser({ schoolId: testSchool._id });
		testCourse = await testObjects.createTestCourse({
			schoolId: testSchool._id,
			userIds: [testUser._id],
		});
		testAdmin = await testObjects.createTestUser({ roles: 'administrator', schoolId: testSchool._id });
	});

	after(async () => {
		testObjects.cleanup;
		await closeNestServices(nestServices);
	});

	it('registered the resolve/scopes service', () => {
		assert.ok(service);
	});

	it('get error if id is no object id', async () => {
		try {
			await service.get('123');
			throw new Error('was not supposed to succeed');
		} catch (err) {
			assert(err.message.includes('Cast to ObjectId failed'));
			assert(err.name === 'BadRequest');
			assert(err.code === 400);
		}
	});

	it('get 404 if no user is found', async () => {
		try {
			await service.get('00006e13b101c8742dc2d092');
			throw new Error('was not supposed to succeed');
		} catch (err) {
			assert(err.message.includes('No record found for id'));
			assert(err.name === 'NotFound');
			assert(err.code === 404);
		}
	});

	it('return scopes if user is found', async () => {
		const data = await service.get(testUser._id);
		assert(data.data.length > 0);
	});

	it('return courseAdmin scope if admin is found and his school has a course', async () => {
		const data = await service.get(testAdmin._id);
		const adminScopes = data.data.filter(
			(scope) => scope.attributes.scopeType === 'courseAdmin' && scope.id.equals(testCourse._id)
		);
		assert(adminScopes.length > 0);
	});

	it('return empty courseAdmin scope if user is not an admin', async () => {
		const data = await service.get(testUser._id);
		const adminScopes = data.data.filter(
			(scope) => scope.attributes.scopeType === 'courseAdmin' && scope.id.equals(testCourse._id)
		);
		assert(adminScopes.length === 0);
	});

	it('return empty courseAdmin scope if admin and admin flag set to false', async () => {
		const data = await service.get(testAdmin._id, { query: { admin: 'false' } });
		const adminScopes = data.data.filter((scope) => scope.attributes.scopeType === 'courseAdmin');
		assert(adminScopes.length === 0);
	});

	it('return courseAdmin scope with only can-read permission if admin and write flag set to false', async () => {
		const data = await service.get(testAdmin._id, { query: { write: 'false' } });
		const adminScopes = data.data.filter((scope) => scope.attributes.scopeType === 'courseAdmin');
		assert(adminScopes.length > 0);
		adminScopes.forEach((scope) => {
			expect(scope.attributes.authorities).to.deep.equal(['can-read']);
		});
	});

	it('return courseAdmin scope with only can-write permission if admin and read flag set to false', async () => {
		const data = await service.get(testAdmin._id, { query: { read: 'false' } });
		const adminScopes = data.data.filter((scope) => scope.attributes.scopeType === 'courseAdmin');
		assert(adminScopes.length > 0);
		adminScopes.forEach((scope) => {
			expect(scope.attributes.authorities).to.deep.equal(['can-write']);
		});
	});
});
