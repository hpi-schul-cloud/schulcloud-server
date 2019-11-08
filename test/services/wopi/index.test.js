const assert = require('assert');
const mockery = require('mockery');
const app = require('../../../src/app');
const mockAws = require('../fileStorage/aws/s3.mock');

const testObjects = require('../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../helpers/services/login')(app);


describe('wopi service', () => {
	const testUserId = '599ec14d8e4e364ec18ff46d';

	const testFile = {
		_id: '597860e9667a0659ed0b0006',
		owner: '599ec14d8e4e364ec18ff46d',
		refOwnerModel: 'user',
		name: 'Test.docx',
		size: 11348,
		storageFileName: '1501061352639-Test.docx',
		permissions: [],
		__v: 0,
	};

	const testFile2 = {
		_id: '597860e9667a0659ed0b1006',
		owner: '599ec14d8e4e364ec18ff46d',
		refOwnerModel: 'user',
		name: 'Test1.docx',
		size: 11348,
		storageFileName: '1501161352639-Test1.docx',
		permissions: [],
		__v: 0,
	};

	const testAccessToken = 'TEST';

	const testUserPayload = {
		userId: '599ec14d8e4e364ec18ff46d',
		email: 'demo-schueler@schul-cloud.org',
		schoolId: '599ec0bb8e4e364ec18ff46c',
	};

	before(function execute(done) {
		this.timeout(10000);
		// Enable mockery to mock objects
		mockery.enable({
			warnOnUnregistered: false,
		});

		mockery.registerMock('aws-sdk', mockAws);

		delete require.cache[require.resolve('../../../src/services/fileStorage/strategies/awsS3')];
		app.service('files').create(testFile)
			.then(() => {
				done();
			});
	});


	after(function execute(done) {
		this.timeout(10000);
		app.service('files').remove(testFile._id)
			.then(() => {
				mockery.deregisterAll();
				mockery.disable();
				done();
			});
	});

	it('registered the wopiFileInfoService correctly', () => {
		assert.ok(app.service('wopi/files/:fileId'));
	});

	it('registered the wopiFileContentsService correctly', () => {
		assert.ok(app.service('wopi/files/:fileId/contents'));
	});

	it('GET /wopi/files/:fileId', async () => { // !
		const user = await testObjects.createTestUser();
		const { authentication: { accessToken } } = await generateRequestParamsFromUser(user);
		const file = await app.service('files').create({
			owner: user._id,
			refOwnerModel: 'user',
			name: 'Test.docx',
			size: 11348,
			storageFileName: `${Date.now()}-Test.docx`,
			permissions: [],
		});
		return app.service('wopi/files/:fileId').find({
			query: { access_token: accessToken },
			route: { fileId: file._id },
			account: { userId: testUserId },
		}).then((result) => {
			assert.equal(result.BaseFileName, file.name);
			assert.equal(result.Size, file.size);
		});
	});

	it('POST /wopi/files/:fileId Action Delete', () => {
		const headers = {};
		headers['x-wopi-override'] = 'DELETE';
		headers.authorization = testAccessToken;

		assert.ok(app.service('wopi/files/:fileId').create({}, {
			account: { userId: testUserId },
			payload: testUserPayload,
			headers,
			fileId: testFile2._id,
			route: { fileId: testFile2._id },
		}));
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
			});
			let params = await generateRequestParamsFromUser(user);
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

	it('POST /wopi/files/:fileId Action Lock and GetLock', async () => { // !
		const user = await testObjects.createTestUser();
		const file = await app.service('files').create({
			owner: user._id,
			refOwnerModel: 'user',
			name: 'Test.docx',
			size: 11348,
			storageFileName: `${Date.now()}-Test.docx`,
			permissions: [],
		});
		const headers = {};
		headers['x-wopi-override'] = 'LOCK';
		const authParams = await generateRequestParamsFromUser(user);
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
		assert.ok(app.service('wopi/files/:fileId/contents').find({
			query: { access_token: testAccessToken },
			route: { fileId: testFile._id },
			account: { userId: testUserId },
		}));
	});
});
