'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const mockAws = require('./aws/s3.mock');
const mockery = require('mockery');
const chai = require('chai');
const signedUrlService = app.service('/fileStorage/signedUrl');
const directoryService = app.service('/fileStorage/directories');

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

	it('registered the directoryModel service', () => {
		assert.ok(app.service('directories'));
	});

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

		let fileNames = ['desktop.ini', 'Desktop.ini', 'Thumbs.db', 'schul-cloud.msi', '.DS_Store', 'tempFile*', 'ehthumbs.db', 'test.stackdump', '.TemporaryItems', '.fuse_hiddenfile'];

		let promises = [];

		fileNames.forEach(name => {
			promises.push(signedUrlService.create({ path: `users/0000d213816abba584714c0a/${name}`}, {
				payload: {userId: '0000d213816abba584714c0a'},
				account: { userId: '0000d213816abba584714c0a'}
			})
				.catch(err => {
					chai.expect(err.name).to.equal('BadRequest');
					chai.expect(err.code).to.equal(400);
					chai.expect(err.message).to.equal(`Die Datei '${name}' ist nicht erlaubt!`);
				})
			);
		});

		return Promise.all(promises);
	});

	it('should not allow any of these folders', () => {

		let folderNames = ['C_drive', 'Windows', '.3T', '$WINDOWSBD', ' ', 'k_drive', 'Temporary Items'];

		let promises = [];

		folderNames.forEach(name => {
			promises.push(directoryService.create({ path: `users/0000d213816abba584714c0a/${name}`}, {
					payload: {userId: '0000d213816abba584714c0a'},
					account: { userId: '0000d213816abba584714c0a'}
				})
					.catch(err => {
						chai.expect(err.name).to.equal('BadRequest');
						chai.expect(err.code).to.equal(400);
						chai.expect(err.message).to.equal(`Der Ordner '${name}' ist nicht erlaubt!`);
					})
			);
		});

		return Promise.all(promises);
	});
});
