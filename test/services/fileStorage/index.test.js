'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const mockAws = require('./aws/s3.mock');
const mockery = require('mockery');
const chai = require('chai');
const signedUrlService = app.service('/fileStorage/signedUrl');

describe('fileStorage service', function () {

	before(function (done) {
		// Enable mockery to mock objects
		mockery.enable({
			warnOnUnregistered: false
		});

		mockery.registerMock('aws-sdk', mockAws);

		delete require.cache[require.resolve('../../../src/services/fileStorage/strategies/awsS3')];
		done();
	});

	after(function () {
		mockery.deregisterAll();
		mockery.disable();
	});

	it('registered the fileStorage service', () => {
		assert.ok(app.service('fileStorage'));
	});

	it('registered the fileModel service', () => {
		assert.ok(app.service('files'));
	});

	/* @deprecated by new model
	it('registered the directoryModel service', () => {
		assert.ok(app.service('directories'));
	});
	*/

	it ('registered the directory rename service', () => {
		assert.ok(app.service('fileStorage/directories/rename'));
	});

	it ('registered the file rename service', () => {
		assert.ok(app.service('fileStorage/rename'));
	});

	it ('registered the file copy service', () => {
		assert.ok(app.service('fileStorage/copy'));
	});

	it ('registered the file total service', () => {
		assert.ok(app.service('fileStorage/total'));
	});

	it('should has a properly worked creation function', () => {
		assert.ok(app.service('fileStorage').create({schoolId: '0000d186816abba584714c5f'}));
	});

	it('should has a properly worked find function', () => {
		assert.ok(app.service('fileStorage').find({qs: {path: 'users/0000d213816abba584714c0a/'}}));
	});

	it('should not allow any of these files', () => {

		const fileNames = ['desktop.ini', 'Desktop.ini', 'Thumbs.db', 'schul-cloud.msi', '.DS_Store', 'tempFile*'];

		const promises = fileNames.map((filename) => {
			return signedUrlService.create({ filename, fileType: 'text/html' },{
					payload: { userId: '0000d213816abba584714c0a'},
					account: { userId: '0000d213816abba584714c0a'}
				})
				.catch(err => {
					chai.expect(err.name).to.equal('BadRequest');
					chai.expect(err.code).to.equal(400);
					chai.expect(err.message).to.equal(`Die Datei '${name}' ist nicht erlaubt!`);
				});
		});

		return Promise.all(promises);
   });
});
