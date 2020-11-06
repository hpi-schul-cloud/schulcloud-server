const assert = require('assert');
const chai = require('chai');
const sinon = require('sinon');
const request = require('request-promise-native');
const appPromise = require('../../../src/app');
const MockNodes = JSON.stringify(require('./mock/response-node.json'));
const MockAuth = require('./mock/response-auth.json');
const EduSharingResponse = require('../../../src/services/edusharing/services/EduSharingResponse');
const testObjects = require('../helpers/testObjects')(appPromise);

describe('EduSharing service', () => {
	let app;
	let eduSharingResponse;
	let eduSharingService;
	let server;

	before(async () => {
		app = await appPromise;
		eduSharingService = app.service('edu-sharing');
		eduSharingResponse = new EduSharingResponse();
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	it('registered the service', async () => {
		assert.ok(eduSharingService);
	});

	it('search with an empty query', async () => {
		try {
			const student = await testObjects.createTestUser({ roles: ['student'] });
			const paramsStudent = await testObjects.generateRequestParamsFromUser(student);

			paramsStudent.query = { searchQuery: '' };
			const response = await eduSharingService.find(paramsStudent);

			chai.expect(JSON.stringify(response)).to.equal(JSON.stringify(eduSharingResponse));
		} catch (err) {
			throw new Error(err);
		}
	});

	it('search with params', async () => {
		try {
			const student = await testObjects.createTestUser({ roles: ['student'] });
			const paramsStudent = await testObjects.generateRequestParamsFromUser(student);

			sinon.stub(request, 'get').returns(MockAuth);

			const postStub = sinon.stub(request, 'post');
			postStub.onCall(0).throws({ statusCode: 403, message: 'Stubbing request fail' });
			postStub.onCall(1).returns(MockNodes);

			paramsStudent.query = { searchQuery: 'foo' };
			const response = await eduSharingService.find(paramsStudent);

			chai.expect(response.total).to.gte(1);
			request.post.restore();
			request.get.restore();
		} catch (err) {
			throw new Error(err);
		}
	});
});
