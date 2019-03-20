

const assert = require('assert');
const chai = require('chai');
const app = require('../../../src/app');

const passwordRecoveryService = app.service('passwordRecovery');


describe('passwordRecovery service', () => {
	const testRecovery =		{
		username: 'schueler@schul-cloud.org',
	};

	before(function PasswordRecoveryTestBefore(done) {
		this.timeout(10000);
		passwordRecoveryService.create(testRecovery)
			.then((result) => {
				done();
			});
	});


	after((done) => {
		passwordRecoveryService.find()
			.then((result) => {
				passwordRecoveryService.remove(result.data[0]);
				done();
			});
	});

	it('registered the passwordRecovery service', () => {
		assert.ok(passwordRecoveryService);
	});

	it('_id is 24 characters long', (done) => {
		passwordRecoveryService.find()
			.then((result) => {
				assert.equal(result.data[0]._id.length, 24);
				done();
			});
	});

	it('found the correct accountId in hook', (done) => {
		passwordRecoveryService.find()
			.then((result) => {
				assert.equal(result.data[0].account, '0000d225816abba584714c9d');
				done();
			});
	});

	it('successfully changed password for user', (done) => {
		passwordRecoveryService.find()
			.then((result) => {
				app.service('passwordRecovery/reset').create({
					accountId: result.data[0].account,
					password: 'schulcloud',
					resetId: result.data[0]._id,
				})
					.then((success) => {
						assert.ok(success);
						done();
					});
			});
	});
});
