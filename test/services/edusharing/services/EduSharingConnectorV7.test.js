const assert = require('assert');
const chai = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../../src/app');
const mockNode = require('../mock/response-node.json');
const mockNodes = require('../mock/response-nodes.json');
const mockH5PRenderer = require('../mock/response-h5p-renderer.json');
const EduSharingResponse = require('../../../../src/services/edusharing/services/EduSharingResponse');
const eduSharingConnectorV7 = require('../../../../src/services/edusharing/services/EduSharingConnectorV7');
const testObjects = require('../../helpers/testObjects')(appPromise());

const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');

describe('EduSharingV7 FIND', () => {
	let app;
	let eduSharingResponse;
	let eduSharingService;
	let eduSharingPlayerService;
	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		eduSharingService = app.service('edu-sharing');
		eduSharingPlayerService = app.service('edu-sharing/player');
		eduSharingService.connector = eduSharingConnectorV7;
		eduSharingResponse = new EduSharingResponse();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	afterEach(async () => {
		sinon.verifyAndRestore();
	});

	it('registered the service', async () => {
		assert.ok(eduSharingService);
		assert.ok(eduSharingPlayerService);
	});

	it('search with an empty query', async () => {
		try {
			const student = await testObjects.createTestUser({ roles: ['student'] });
			const paramsStudent = await testObjects.generateRequestParamsFromUser(student);
			paramsStudent.query = { searchQuery: '' };
			const result = await eduSharingService.find(paramsStudent);

			chai.expect(JSON.stringify(result)).to.equal(JSON.stringify(eduSharingResponse));
		} catch (err) {
			throw new Error(err);
		}
	});

	it('search with params', async () => {
		try {
			const student = await testObjects.createTestUser({ roles: ['student'] });
			const paramsStudent = await testObjects.generateRequestParamsFromUser(student);

			const postStub = sinon.stub(axios, 'post');
			postStub.onCall(0).throws({ statusCode: 403, message: 'Stubbing request fail' });
			postStub.onCall(1).returns({ data: mockNodes });

			paramsStudent.query = { searchQuery: 'foo' };
			const result = await eduSharingService.find(paramsStudent);

			chai.expect(result.total).to.gte(1);
		} catch (err) {
			throw new Error(err);
		}
	});

	it('should search for a collection', async () => {
		try {
			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			const postStub = sinon.stub(axios, 'post');
			postStub.onCall(0).returns({ data: mockNodes });

			params.query = { collection: 'a4808865-da94-4884-bdba-0ad66070e83b' };
			const result = await eduSharingService.find(params);

			chai.expect(result.total).to.gte(1);
		} catch (err) {
			throw new Error(err);
		}
	});

	it('should search with searchable flag', async () => {
		try {
			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			const postStub = sinon.stub(axios, 'post');
			postStub.onCall(0).returns({ data: mockNodes });

			params.query = { searchQuery: 'foo' };
			const result = await eduSharingService.find(params);

			chai.expect(result.total).to.gte(1);
		} catch (err) {
			throw new Error(err);
		}
	});

	it('should fail to get a node with invalid uuid', async () => {
		try {
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId: '5fcfb0bc685b9af4d4abf899' });
			const params = await testObjects.generateRequestParamsFromUser(user);
			await eduSharingService.get('dummyNodeId', params);
			throw new Error('should have failed');
		} catch (err) {
			chai.expect(err.code).to.equal(404);
			chai.expect(err.message).to.equal('Invalid node id dummyNodeId');
		}
	});

	it('should get a node', async () => {
		try {
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId: '5fcfb0bc685b9af4d4abf899' });
			const params = await testObjects.generateRequestParamsFromUser(user);

			const postStub = sinon.stub(axios, 'post');
			postStub.onCall(0).returns({ data: mockNode });

			const result = await eduSharingService.get('9ff3ee4e-e679-4576-bad7-0eeb9b174716', params);
			chai.expect(result.title).to.equal('dummy title');
		} catch (err) {
			throw new Error(err);
		}
	});

	it('player should return h5p data', async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId: '5fcfb0bc685b9af4d4abf899' });
		const params = await testObjects.generateRequestParamsFromUser(user);

		const getStub = sinon.stub(axios, 'get');
		getStub.onCall(0).returns({ data: mockH5PRenderer });

		const result = await eduSharingPlayerService.get('dummy-id', params);

		chai.expect(result).to.eql({ iframe_src: 'iframeDummySrc', script_src: 'https://test.test/dummy.js' });
	});

	it('player should fail when edushare response is invalid', async () => {
		try {
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId: '5fcfb0bc685b9af4d4abf899' });
			const params = await testObjects.generateRequestParamsFromUser(user);

			const getStub = sinon.stub(axios, 'get');
			getStub.onCall(0).returns({ data: {} });

			await eduSharingPlayerService.get('dummy-id', params);

			throw new Error('should have failed');
		} catch (err) {
			chai.expect(err.code).to.equal(503);
			chai.expect(err.message).to.equal('Unexpected response from Edu-Sharing renderer.');
		}
	});

	it('player should fail when edushare response has invalid details', async () => {
		try {
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId: '5fcfb0bc685b9af4d4abf899' });
			const params = await testObjects.generateRequestParamsFromUser(user);

			const getStub = sinon.stub(axios, 'get');
			getStub.onCall(0).returns({ data: { detailsSnippet: '' } });

			await eduSharingPlayerService.get('dummy-id', params);

			throw new Error('should have failed');
		} catch (err) {
			chai.expect(err.message).to.not.equal('should have failed');
			chai.expect(err.code).to.equal(503);
			chai.expect(err.message).to.equal('No data detected in Edu-Sharing renderer response.');
		}
	});
});

describe('EduSharingV7 config flags', () => {
	let app;
	let eduSharingService;
	let server;
	let nestServices;
	let originalConfiguration;

	before(async () => {
		originalConfiguration = Configuration.get('FEATURE_ES_COLLECTIONS_ENABLED');
		app = await appPromise();
		eduSharingService = app.service('edu-sharing');
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		Configuration.set('FEATURE_ES_COLLECTIONS_ENABLED', originalConfiguration);
		await testObjects.cleanup(app);
		await server.close();
		await closeNestServices(nestServices);
	});

	afterEach(async () => {
		sinon.verifyAndRestore();
	});

	it('should search with collections flag disabled', async () => {
		try {
			Configuration.set('FEATURE_ES_COLLECTIONS_ENABLED', false);

			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const params = await testObjects.generateRequestParamsFromUser(user);

			const postStub = sinon.stub(axios, 'post');
			postStub.onCall(0).returns({ data: mockNodes });

			params.query = { searchQuery: 'foo' };
			const result = await eduSharingService.find(params);

			chai.expect(result.total).to.gte(1);
		} catch (err) {
			throw new Error(err);
		}
	});
});
