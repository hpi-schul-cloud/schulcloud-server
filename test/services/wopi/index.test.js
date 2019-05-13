const assert = require('assert');
const mockery = require('mockery');
const app = require('../../../src/app');
const mockAws = require('../fileStorage/aws/s3.mock');


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

	it('GET /wopi/files/:fileId', (done) => { // !
		app.service('wopi/files/:fileId').find({
			query: { access_token: testAccessToken },
			route: { fileId: testFile._id },
			account: { userId: testUserId },
		}).then((result) => {
			assert.equal(result.BaseFileName, testFile.name);
			assert.equal(result.Size, testFile.size);
			done();
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

	it('POST /wopi/files/:fileId No Action', (done) => {
		const headers = {};
		headers.authorization = testAccessToken;
		app.service('wopi/files/:fileId').create({}, {
			account: { userId: testUserId },
			payload: testUserPayload,
			headers,
			fileId: testFile2._id,
			route: { fileId: testFile2._id },
		}).catch((e) => {
			assert.equal(e.name, 'BadRequest');
			assert.equal(e.message, 'X-WOPI-Override header was not provided or was empty!');
			done();
		});
	});

	it('POST /wopi/files/:fileId Action Lock and GetLock', (done) => { // !
		const headers = {};
		headers.authorization = testAccessToken;
		headers['x-wopi-override'] = 'LOCK';
		const params = {
			account: { userId: testUserId },
			payload: testUserPayload,
			headers,
			route: { fileId: testFile._id },
			_id: testFile._id,
		};
		// let lockId;

		app.service('wopi/files/:fileId').create({}, params)
			.then(async (res) => {
				const { lockId } = res;
				assert.notEqual(lockId, undefined);

				headers.authorization = testAccessToken;
				headers['x-wopi-override'] = 'GET_LOCK';
				const result = await app.service('wopi/files/:fileId').create({}, {
					account: { userId: testUserId },
					payload: testUserPayload,
					headers,
					fileId: testFile._id,
					route: { fileId: testFile._id },
					_id: testFile._id,
				});

				assert.equal(lockId.toString(), result.lockId.toString());
				done();
			});
	});

	it('GET /wopi/files/:fileId/contents', () => {
		assert.ok(app.service('wopi/files/:fileId/contents').find({
			query: { access_token: testAccessToken },
			route: { fileId: testFile._id },
			account: { userId: testUserId },
		}));
	});
});
