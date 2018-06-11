'use strict';
const assert = require('assert');
const app = require('../../../src/app');
const fileModelService = app.service('files');
const wopiFileInfoService = app.service('wopi/files/:fileId');

describe('wopi service', function () {
   
  const mockFile = {
    "_id" : "597860e9667a0659ed0b0006",
    "key" : "users/5937c000a5896d0515fbf270/Test.docx",
    "path" : "users/5937c000a5896d0515fbf270/",
    "name" : "Test.docx",
    "size" : 11348,
    "flatFileName" : "1501061352639-Test.docx",
    "permissions" : [],
    "__v" : 0
  };

  const exampleAccessToken = "TEST";

	before(function (done) {
		this.timeout(10000);
		fileModelService.create(mockFile)
			.then(_ => {
				done();
			});
	});


	after(function(done) {
    this.timeout(10000);
		fileModelService.remove(mockFile._id)
			.then(_ => {
				done();
			});
	});

	it('registered the wopiFileInfoService correctly', () => {
		assert.ok(app.service('wopi/files/:fileId'));
	});

	it('registered the wopiFileContentsService correctly', () => {
		assert.ok(app.service('wopi/files/:fileId/contents'));
  });

	it('GET /wopi/files/:fileId', (done) => {
		wopiFileInfoService.find({
      query: {access_token: exampleAccessToken},
      fileId: mockFile._id,
      account: {userId: "5937c000a5896d0515fbf270"} //same as above
    }).then(result => {
        assert.equal(result['BaseFileName'], mockFile.name);
        assert.equal(result['Size'], mockFile.size);
				done();
			});
	});
});
