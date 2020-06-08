const assert = require('assert');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);

const passwordRecoveryService = app.service('passwordRecovery');

const PORT = 0;

describe('passwordRecovery service', () => {
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

	before((done) => {
		server = app.listen(PORT, async () => {
			savedUser = await testObjects.createTestUser();
			savedAccount = await testObjects.createTestAccount(newAccount, null, savedUser);
			await passwordRecoveryService.create({ username: recoveryUsername });
			done();
		});
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

	it('found the correct accountId in hook', async () => {
		const result = await passwordRecoveryService.find({
			query: {
				account: savedAccount._id,
			},
		});
		assert.equal(result.data[0].account.toHexString(), savedAccount._id.toHexString());
	});

	it('registered the passwordRecovery service', () => {
		assert.ok(passwordRecoveryService);
	});

	it('_id is 24 characters long', async () => {
		const result = await passwordRecoveryService.find();
		assert.equal(result.data[0]._id.length, 24);
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
