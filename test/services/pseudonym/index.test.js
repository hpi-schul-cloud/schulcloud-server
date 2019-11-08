const assert = require('assert');
const chai = require('chai');
const app = require('../../../src/app');

const pseudonymService = app.service('pseudonym');
const toolService = app.service('ltiTools');
const { expect } = chai;
const { cleanup, createTestUser } = require('../helpers/testObjects')(app);

describe('pseudonym service', function pseudonymTest() {
	this.timeout(10000);

	const testTool1 = {
		_id: '5a79cb15c3874f9aea14daa5',
		name: 'test1',
		url: 'https://tool.com?pseudonym={PSEUDONYM}',
		isLocal: true,
		isTemplate: true,
		resource_link_id: 1,
		lti_version: '1p0',
		lti_message_type: 'basic-start-request',
		secret: '1',
		key: '1',
	};
	const testTool2 = {
		_id: '5a79cb15c3874f9aea14daa6',
		originTool: '5a79cb15c3874f9aea14daa5',
		name: 'test2',
		url: 'https://tool.com?pseudonym={PSEUDONYM}',
		isLocal: true,
		resource_link_id: 1,
		lti_version: '1p0',
		lti_message_type: 'basic-start-request',
		secret: '1',
		key: '1',
	};

	let testUser1;
	let testUser2;
	let testUser3;

	before(async () => {
		testUser1 = await createTestUser();
		testUser2 = await createTestUser();
		testUser3 = await createTestUser();

		await toolService.create(testTool1);
		await toolService.create(testTool2);
	});

	after(async () => {
		await pseudonymService.remove(null, { query: {} });
		await	toolService.remove(testTool1);
		await toolService.remove(testTool2);
		await cleanup();
		return Promise.resolve();
	});

	it('is registered', () => {
		assert.ok(app.service('pseudonym'));
	});

	it('throws MethodNotAllowed on GET', () => pseudonymService.get(testTool1._id).then(() => {
		throw new Error('Was not supposed to succeed');
	}).catch((err) => {
		assert(err.name, 'MethodNotAllowed');
		assert(err.code, 405);
	}));

	it('throws MethodNotAllowed on UPDATE', () => pseudonymService.update(testTool1._id, {}).then(() => {
		throw new Error('Was not supposed to succeed');
	}).catch((err) => {
		assert(err.name, 'MethodNotAllowed');
		assert(err.code, 405);
	}));

	it('throws MethodNotAllowed on PATCH', () => pseudonymService.patch(testTool1._id, {}).then(() => {
		throw new Error('Was not supposed to succeed');
	}).catch((err) => {
		assert(err.name, 'MethodNotAllowed');
		assert(err.code, 405);
	}));

	it('throws MethodNotAllowed on REMOVE', () => pseudonymService.remove(testTool1._id).then(() => {
		throw new Error('Was not supposed to succeed');
	}).catch((err) => {
		assert(err.name, 'MethodNotAllowed');
		assert(err.code, 405);
	}));

	let pseudonym = '';
	it('creates missing pseudonym on FIND for derived tool', () => pseudonymService.find({
		query: {
			userId: testUser3._id,
			toolId: testTool2._id,
		},
	}).then((result) => {
		({ pseudonym } = result.data[0]);
		expect(result.data[0].pseudonym).to.be.a('String');
	}));

	it('returns existing pseudonym on FIND for derived tool', () => pseudonymService.find({
		query: {
			userId: testUser3._id,
			toolId: testTool2._id,
		},
	}).then((result) => {
		expect(result.data.length).to.eql(1);
		expect(result.data[0].pseudonym).to.eql(pseudonym);
	}));

	it('returns existing pseudonym on FIND for origin tool', () => pseudonymService.find({
		query: {
			userId: testUser3._id,
			toolId: testTool1._id,
		},
	}).then((result) => {
		expect(result.data[0].pseudonym).to.eql(pseudonym);
	}));

	it('creates missing pseudonyms on FIND with multiple users', () => pseudonymService.find({
		query: {
			userId: [testUser1._id,
				testUser2._id],
			toolId: testTool1._id,
		},
	}).then((result) => {
		expect(result.data).to.be.a('Array');
		expect(result.data.length).to.eql(2);
	}));

	it("doesn't create pseudonyms on FIND for missing users", () => pseudonymService.find({
		query: {
			userId: '599ec1688e4e364ac18ff46e', // not existing userId
			toolId: testTool1._id,
		},
	}).then(() => {
		throw new Error('Was not supposed to succeed');
	}).catch((error) => {
		assert(error.name, 'NotFound');
		assert(error.code, 404);
	}));

	it("doesn't create pseudonyms on FIND for missing tool", () => pseudonymService.find({
		query: {
			userId: '599ec1688e4e364ec18ff46e',
			toolId: '599ec1688e4e364ec18ff46e', // not existing toolId
		},
	}).then(() => {
		throw new Error('Was not supposed to succeed');
	}).catch((error) => {
		assert(error.name, 'NotFound');
		assert(error.code, 404);
	}));
});
