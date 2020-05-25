const assert = require('assert');
const app = require('../../../src/app');

const passwordRecoveryService = app.service('passwordRecovery');

describe('passwordRecovery service', () => {
	before(() => {
		app.setup();
	});

	it('should work for existing email addresses', () => {
		passwordRecoveryService
			.create({
				username: 'schueler@schul-cloud.org',
			})
			.then((res) => {
				assert.ok(res);
			});
	});

	it('should work even if email address does not exist', () => {
		passwordRecoveryService
			.create({
				username: 'user@mail.com',
			})
			.then((res) => {
				assert.ok(res);
			});
	});

	it('should fail for blocked domains', () => {
		passwordRecoveryService
			.create({
				username: 'user@my10minutemail.com',
			})
			.catch((error) => {
				assert.equal(error.code, 400);
			});
	});

	describe('handle reset request', () => {
		const testRecovery = {
			username: 'schueler@schul-cloud.org',
		};

		before(function before(done) {
			this.timeout(10000);

			passwordRecoveryService.create(testRecovery)
				.then(() => {
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

		it('_id is 24 characters long', async () => {
			const result = await passwordRecoveryService.find();
			assert.equal(result.data[0]._id.length, 24);
		});

		it('found the correct accountId in hook', async () => {
			const result = await passwordRecoveryService.find();
			assert.equal(result.data[0].account, '0000d225816abba584714c9d');
		});

		it('successfully changed password for user', async () => {
			const result = await passwordRecoveryService.find();
			const success = await app.service('passwordRecovery/reset').create({
				accountId: result.data[0].account,
				password: 'schulcloud',
				resetId: result.data[0]._id,
			});
			assert.ok(success);
		});
	});
});
