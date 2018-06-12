'use strict';
const assert = require('assert');
const app = require('../../../src/app');
const fileModelService = app.service('files');
const wopiFileInfoService = app.service('wopi/files/:fileId');
const mockAws = require('../fileStorage/aws/s3.mock');
const mockery = require('mockery');

describe('wopi service', function () {

	const testUserId = "5937c000a5896d0515fbf270";
   
  const testFile = {
    "_id" : "597860e9667a0659ed0b0006",
    "key" : `users/${testUserId}/Test.docx`,
    "path" : `users/${testUserId}/`,
    "name" : "Test.docx",
    "size" : 11348,
    "flatFileName" : "1501061352639-Test.docx",
    "permissions" : [],
    "__v" : 0
	};
	
	const testFile2 = {
    "_id" : "597860e9667a0659ed0b1006",
    "key" : `users/${testUserId}/Test1.docx`,
    "path" : `users/${testUserId}/`,
    "name" : "Test1.docx",
    "size" : 11348,
    "flatFileName" : "1501161352639-Test1.docx",
    "permissions" : [],
    "__v" : 0
  };

  const testAccessToken = "TEST";

	before(function (done) {
		this.timeout(10000);
		fileModelService.create(testFile)
			.then(_ => {
				// Enable mockery to mock objects
				mockery.enable({
					warnOnUnregistered: false
				});

				mockery.registerMock('aws-sdk', mockAws);

				delete require.cache[require.resolve('../../../src/services/fileStorage/strategies/awsS3')];

				done();
			});
	});


	after(function(done) {
    this.timeout(10000);
		fileModelService.remove(testFile._id)
			.then(_ => {
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

	it('GET /wopi/files/:fileId', done => {
		wopiFileInfoService.find({
      query: {access_token: testAccessToken},
      fileId: testFile._id,
      account: {userId: "5937c000a5896d0515fbf270"} //same as above
    }).then(result => {
        assert.equal(result['BaseFileName'], testFile.name);
        assert.equal(result['Size'], testFile.size);
				done();
			});
	});

	it('POST /wopi/files:fileId Action Delete', done => {
		let headers = {};
		headers['X-WOPI-OVERRIDE'] = 'DELETE';
		headers['authorization'] = testAccessToken;
		fileModelService.create(testFile2).then(_ => {
			wopiFileInfoService.create({
				fileId: testFile2._id,
				account: {userId: testUserId}
			}, {headers: headers}).then(result => {
				console.log(result);
				done();
			});
		}).catch(e => console.log(e));
	});
});
