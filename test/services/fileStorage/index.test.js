'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const mockAws = require('./aws/s3.mock');
const mockery = require('mockery');

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

	it('should has a properly worked creation function', () => {
		assert.ok(app.service('fileStorage').create({schoolId: '0000d186816abba584714c5f'}));
	});
});
