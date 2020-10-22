const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const appPromise = require('../../../src/app');

const Pseudonym = require('../../../src/services/pseudonym/model');

const { cleanup, createTestUser, generateRequestParamsFromUser } = require('../helpers/testObjects')(appPromise);

describe('pseudonym service', function pseudonymTest() {
	let app;
	let pseudonymService;
	let toolService;
	let server;
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
		app = await appPromise;
		server = await app.listen(0);
		pseudonymService = app.service('pseudonym');
		toolService = app.service('ltiTools');

		testUser1 = await createTestUser();
		testUser2 = await createTestUser();
		testUser3 = await createTestUser();

		await toolService.create(testTool1);
		await toolService.create(testTool2);
	});

	after(async () => {
		await Pseudonym.remove({}).exec();
		await toolService.remove(testTool1);
		await toolService.remove(testTool2);
		await cleanup();
		await server.close();
	});

	it('is registered', () => {
		expect(app.service('pseudonym')).to.be.ok;
	});

	it('throws MethodNotAllowed on GET', () =>
		pseudonymService
			.get(testTool1._id)
			.then(() => {
				throw new Error('Was not supposed to succeed');
			})
			.catch((err) => {
				expect(err.name).to.equal('MethodNotAllowed');
				expect(err.code).to.equal(405);
			}));

	it('throws MethodNotAllowed on UPDATE', () =>
		pseudonymService
			.update(testTool1._id, {})
			.then(() => {
				throw new Error('Was not supposed to succeed');
			})
			.catch((err) => {
				expect(err.name).to.equal('MethodNotAllowed');
				expect(err.code).to.equal(405);
			}));

	it('throws MethodNotAllowed on PATCH', () =>
		pseudonymService
			.patch(testTool1._id, {})
			.then(() => {
				throw new Error('Was not supposed to succeed');
			})
			.catch((err) => {
				expect(err.name).to.equal('MethodNotAllowed');
				expect(err.code).to.equal(405);
			}));

	it('throws MethodNotAllowed on external call to REMOVE', async () => {
		const user = await createTestUser({ roles: 'teacher' });
		const params = await generateRequestParamsFromUser(user);
		return pseudonymService
			.remove(testTool1._id, params)
			.then(() => {
				throw new Error('Was not supposed to succeed');
			})
			.catch((err) => {
				expect(err.name).to.equal('MethodNotAllowed');
				expect(err.code).to.equal(405);
			});
	});

	it('does not throw on internal call to REMOVE', async () => {
		const pseudonym = await Pseudonym.create({});
		await pseudonymService.remove(pseudonym._id);
		expect(await Pseudonym.findById(pseudonym._id)).to.equal(null);
	});

	let pseudonym = '';
	it('creates missing pseudonym on FIND for derived tool', () =>
		pseudonymService
			.find({
				query: {
					userId: testUser3._id,
					toolId: testTool2._id,
				},
			})
			.then((result) => {
				expect(Array.isArray(result.data)).to.equal(true);
				({ pseudonym } = result.data[0]);
				expect(pseudonym).to.be.a('String');
			}));

	it('returns existing pseudonym on FIND for derived tool', () =>
		pseudonymService
			.find({
				query: {
					userId: testUser3._id,
					toolId: testTool2._id,
				},
			})
			.then((result) => {
				expect(result.data.length).to.equal(1);
				expect(result.data[0].pseudonym).to.equal(pseudonym);
			}));

	it('returns existing pseudonym on FIND for origin tool', () =>
		pseudonymService
			.find({
				query: {
					userId: testUser3._id,
					toolId: testTool1._id,
				},
			})
			.then((result) => {
				expect(result.data[0].pseudonym).to.eql(pseudonym);
			}));

	it('creates missing pseudonyms on FIND with multiple users', () =>
		pseudonymService
			.find({
				query: {
					userId: [testUser1._id, testUser2._id],
					toolId: testTool1._id,
				},
			})
			.then((result) => {
				expect(result.data).to.be.a('Array');
				expect(result.data.length).to.eql(2);
			}));

	it("doesn't create pseudonyms on FIND for missing users", () =>
		pseudonymService
			.find({
				query: {
					userId: new ObjectId(), // not existing userId
					toolId: testTool1._id,
				},
			})
			.then(() => {
				throw new Error('Was not supposed to succeed');
			})
			.catch((error) => {
				expect(error.name).to.equal('BadRequest');
				expect(error.code).to.equal(400);
			}));

	it("doesn't create pseudonyms on FIND for missing tool", () =>
		pseudonymService
			.find({
				query: {
					userId: '599ec1688e4e364ec18ff46e',
					toolId: '599ec1688e4e364ec18ff46e', // not existing toolId
				},
			})
			.then(() => {
				throw new Error('Was not supposed to succeed');
			})
			.catch((error) => {
				expect(error.name).to.equal('NotFound');
				expect(error.code).to.equal(404);
			}));
});
