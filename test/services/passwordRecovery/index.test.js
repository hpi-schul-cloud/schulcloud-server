'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const passwordRecoveryService = app.service('passwordRecovery');
const chai = require('chai');

describe('passwordRecovery service', function() {

	const testRecovery =
		{
			username: 'schueler@schul-cloud.org'
		};

	before(function (done) {
		this.timeout(10000);
		passwordRecoveryService.create(testRecovery)
			.then(result => {
				done();
			});
	});


	after(function(done) {
		passwordRecoveryService.find()
			.then(result => {
				passwordRecoveryService.remove(result.data[0]);
				done();
			});
	});

	it('registered the passwordRecovery service', () => {
		assert.ok(passwordRecoveryService);
	});

	it('_id is 24 characters long', (done) => {
		passwordRecoveryService.find()
			.then(result => {
				assert.equal(result.data[0]._id.length, 24);
				done();
			});
	});

	it('found the correct accountId in hook', (done) => {
		passwordRecoveryService.find()
			.then(result => {
				assert.equal(result.data[0].account, "0000d225816abba584714c9d");
				done();
			});
	});
});

