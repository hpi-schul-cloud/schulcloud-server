import assert from 'assert';
import chai from 'chai';
import sinon from 'sinon';
import request from 'request-promise-native';
import appPromise from '../../../../src/app';
const MockNode = JSON.stringify(require('../mock/response-node.json'));
const MockNodeRestricted = JSON.stringify(require('../mock/response-node-restricted.json'));
const MockNodes = JSON.stringify(require('../mock/response-nodes.json'));
import MockAuth from '../mock/response-auth.json';
import EduSharingResponse from '../../../../src/services/edusharing/services/EduSharingResponse';
import testObjectsImport from '../../helpers/testObjects'; 
const testObjects = testObjectsImport(appPromise);

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

	it('should get a node', async () => {
		try {
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId: '5fcfb0bc685b9af4d4abf899' });
			const params = await testObjects.generateRequestParamsFromUser(user);
			const getStub = sinon.stub(request, 'get');

			// cookie already set
			// getStub.onCall(1).returns(MockAuth);
			getStub.onCall(0).returns(MockNode);
			const mockImg = { body: 'dummyImage' };
			getStub.onCall(1).returns(mockImg);

			const response = await eduSharingService.get('dummyNodeId', params);
			chai.expect(response.title).to.equal('dummy title');
			request.get.restore();
			getStub.reset();
		} catch (err) {
			throw new Error(err);
		}
	});

	it('should fail to get a restricted node', async () => {
		try {
			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const params = await testObjects.generateRequestParamsFromUser(user);
			const getStub = sinon.stub(request, 'get');

			// cookie already set
			// getStub.onCall(1).returns(MockAuth);
			getStub.onCall(0).returns(MockNodeRestricted);

			await eduSharingService.get('dummyNodeId', params);
			request.get.restore();
			getStub.reset();
			throw new Error('should have failed');
		} catch (err) {
			chai.expect(err.message).to.not.equal('should have failed');
			chai.expect(err.code).to.equal(403);
			chai.expect(err.message).to.equal('This content is not available for your school');
		}
	});
});
