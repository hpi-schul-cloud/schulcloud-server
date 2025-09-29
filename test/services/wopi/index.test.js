const assert = require('assert');
const appPromise = require('../../../src/app');
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');
const testHelper = require('../helpers/testObjects');

class AWSStrategy {
	deleteFile() {
		return Promise.resolve();
	}

	generateSignedUrl() {
		return Promise.resolve('https://something.com');
	}

	getSignedUrl() {
		return Promise.resolve('https://something.com');
	}
}

// TODO: throw unhandled rejection - malformed jwt
describe('wopi service', () => {
	let app;
	const testUserId = '599ec14d8e4e364ec18ff46d';
	let server;
	let nestServices;
	let testObjects;
	let testFile;
	let testFile2;

	const testAccessToken = 'TEST';

	const testUserPayload = {
		userId: '599ec14d8e4e364ec18ff46d',
		email: 'demo-schueler@schul-cloud.org',
		schoolId: '5f2987e020834114b8efd6f6',
	};

	before(async () => {
		app = await appPromise();
		testObjects = testHelper(app);
		server = await app.listen(0);
		nestServices = await setupNestServices(app);

		testFile = {
			_id: '597860e9667a0659ed0b0006',
			owner: '599ec14d8e4e364ec18ff46d',
			refOwnerModel: 'user',
			name: 'Test.docx',
			size: 11348,
			storageFileName: '1501061352639-Test.docx',
			permissions: [],
			bucket: 'bucket-test',
			storageProviderId: new testObjects.generateObjectId(),
			__v: 0,
		};

		testFile2 = {
			_id: '597860e9667a0659ed0b1006',
			owner: '599ec14d8e4e364ec18ff46d',
			refOwnerModel: 'user',
			name: 'Test1.docx',
			size: 11348,
			storageFileName: '1501161352639-Test1.docx',
			permissions: [],
			bucket: 'bucket-test',
			storageProviderId: new testObjects.generateObjectId(),
			__v: 0,
		};

		const fileStorageService = app.service('/fileStorage/');
		const signedUrlService = app.service('/fileStorage/signedUrl');

		fileStorageService.Stategy = AWSStrategy;
		signedUrlService.Stategy = AWSStrategy;

		await app.service('files').create(testFile);
	});

	after(async () => {
		await app.service('files').remove(testFile._id);
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	it('registered the wopiFileInfoService correctly', () => {
		assert.ok(app.service('wopi/files/:fileId'));
	});

	it('registered the wopiFileContentsService correctly', () => {
		assert.ok(app.service('wopi/files/:fileId/contents'));
	});

	it('GET /wopi/files/:fileId', async () => {
		const user = await testObjects.createTestUser();
		const {
			authentication: { accessToken },
		} = await testObjects.generateRequestParamsFromUser(user);
		const file = await app.service('files').create({
			owner: user._id,
			refOwnerModel: 'user',
			name: 'Test.docx',
			size: 11348,
			storageFileName: `${Date.now()}-Test.docx`,
			permissions: [],
			bucket: 'bucket-test',
			storageProviderId: new testObjects.generateObjectId(),
		});

		return app
			.service('wopi/files/:fileId')
			.find({
				query: { access_token: accessToken },
				route: { fileId: file._id },
				account: { userId: testUserId },
			})
			.then((result) => {
				assert.equal(result.BaseFileName, file.name);
				assert.equal(result.Size, file.size);
			});
	});

	it('POST /wopi/files/:fileId Action Delete', () => {
		const headers = {};
		headers['x-wopi-override'] = 'DELETE';
		headers.authorization = testAccessToken;

		assert.ok(
			app.service('wopi/files/:fileId').create(
				{},
				{
					account: { userId: testUserId },
					payload: testUserPayload,
					headers,
					fileId: testFile2._id,
					route: { fileId: testFile2._id },
				}
			)
		);
	});

	it('POST /wopi/files/:fileId No Action', async () => {
		try {
			const user = await testObjects.createTestUser();
			const headers = {};
			const file = await app.service('files').create({
				owner: user._id,
				refOwnerModel: 'user',
				name: 'Test.docx',
				size: 11348,
				storageFileName: `${Date.now()}-Test.docx`,
				permissions: [],
				bucket: 'bucket-test',
				storageProviderId: new testObjects.generateObjectId(),
			});
			let params = await testObjects.generateRequestParamsFromUser(user);
			params = Object.assign(params, {
				query: { access_token: params.authentication.accessToken },
				headers,
				fileId: file._id,
				route: { fileId: file._id },
			});
			await app.service('wopi/files/:fileId').create({}, params);
			throw new Error('schould have failed');
		} catch (e) {
			assert.equal(e.name, 'BadRequest');
			assert.equal(e.message, 'X-WOPI-Override header was not provided or was empty!');
		}
	});

	it('POST /wopi/files/:fileId Action Lock and GetLock', async () => {
		// !
		const user = await testObjects.createTestUser();
		const file = await app.service('files').create({
			owner: user._id,
			refOwnerModel: 'user',
			name: 'Test.docx',
			size: 11348,
			storageFileName: `${Date.now()}-Test.docx`,
			permissions: [],
			bucket: 'bucket-test',
			storageProviderId: new testObjects.generateObjectId(),
		});
		const headers = {};
		headers['x-wopi-override'] = 'LOCK';
		const authParams = await testObjects.generateRequestParamsFromUser(user);
		const firstparams = Object.assign(authParams, {
			query: { access_token: authParams.authentication.accessToken },
			headers,
			_id: file._id,
			route: { fileId: file._id },
		});

		const { lockId } = await app.service('wopi/files/:fileId').create({}, firstparams);
		assert.notEqual(lockId, undefined);

		headers['x-wopi-override'] = 'GET_LOCK';
		const secondparams = Object.assign(authParams, {
			query: { access_token: authParams.authentication.accessToken },
			headers,
			_id: file._id,
			route: { fileId: file._id },
		});
		const result = await app.service('wopi/files/:fileId').create({}, secondparams);

		assert.equal(lockId.toString(), result.lockId.toString());
	});

	it('GET /wopi/files/:fileId/contents', () => {
		assert.ok(
			app.service('wopi/files/:fileId/contents').find({
				query: { access_token: testAccessToken },
				route: { fileId: testFile._id },
				account: { userId: testUserId },
			})
		);
	});
});
