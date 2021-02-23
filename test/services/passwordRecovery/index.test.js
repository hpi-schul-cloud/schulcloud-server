const assert = require('assert');
const { expect } = require('chai');

const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise);
const passwordRecovery = require('../../../src/services/passwordRecovery/model');

const PORT = 0;

describe('passwordRecovery service', () => {
	let app;
	let passwordRecoveryService;

	let server;
	let savedUser;
	let savedAccount;
	const recoveryUsername = 'recoveryuser@schul-cloud.org';

	const newAccount = {
		username: recoveryUsername,
		password: '$2a$10$wMuk7hpjULOEJrTW/CKtU.lIETKa.nEs8fncqLJ74SMeX.fzJACla',
		activated: true,
		createdAt: '2017-09-04T12:51:58.49Z',
	};

	before(async () => {
		app = await appPromise;
		passwordRecoveryService = app.service('passwordRecovery');
		server = await app.listen(0);
		savedUser = await testObjects.createTestUser();
		savedAccount = await testObjects.createTestAccount(newAccount, null, savedUser);
		await passwordRecoveryService.create({ username: recoveryUsername });
	});

	after((done) => {
		testObjects.cleanup();
		server.close(done);
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

	it('found the correct passwordRecovery document for account', async () => {
		const result = await passwordRecovery.findOne({
			account: savedAccount._id,
		});
		assert.equal(result.account.toHexString(), savedAccount._id.toHexString());
	});

	it('registered the passwordRecovery service', () => {
		assert.ok(passwordRecoveryService);
	});

	it('token is 32 characters long', async () => {
		const result = await passwordRecovery.findOne({
			account: savedAccount._id,
		});
		assert.equal(result.token.length, 32);
	});

	it('successfully changed password for user', async () => {
		const result = await passwordRecovery.findOne({
			account: savedAccount._id,
		});
		const success = await app.service('passwordRecovery/reset').create({
			password: 'schulcloud',
			resetId: result.token,
		});
		assert.ok(success);
	});

	it('should fail if it is pass not valid token', async () => {
		const resetId = { $ne: 'X' };
		const service = app.service('passwordRecovery/reset');
		try {
			const result = await service.create({
				password: 'schulcloud',
				resetId,
			});
			throw new Error('Should fail.', result);
		} catch (err) {
			expect(err.message).equal(service.errors.inputValidation);
		}
	});
});
