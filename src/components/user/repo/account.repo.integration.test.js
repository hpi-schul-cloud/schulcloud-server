const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;

const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const accountRepo = require('./account.repo');
const accountModel = require('../../../services/account/model');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('account repository', () => {
	let app;
	let server;

	before(async () => {
		delete require.cache[require.resolve('../../../../src/app')];
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	describe('deleteAccountForUserId', () => {
		it('when an account is deleted by userId, then it returns the deleted object', async () => {
			const user = await testObjects.createTestUser();
			const credentials = { username: user.email, password: `${Date.now()}` };
			const account = await testObjects.createTestAccount(credentials, 'local', user);

			const result = await accountRepo.deleteAccountForUserId(user._id);
			expect(result).to.not.be.undefined;
			expect(result._id.toString()).to.equal(account._id.toString());
		});

		it('when an account is deleted by userId, then the account should be gone from db', async () => {
			const user = await testObjects.createTestUser();
			const credentials = { username: user.email, password: `${Date.now()}` };
			const account = await testObjects.createTestAccount(credentials, 'local', user);

			await accountRepo.deleteAccountForUserId(user._id);

			const result = await accountModel.findById(account._id).lean().exec();
			expect(result).to.be.null;
		});
	});

	describe('getUserAccount', () => {
		it('when the funcion is called with a valid id, then it returns the account object', async () => {
			const user = await testObjects.createTestUser();
			const credentials = { username: user.email, password: `${Date.now()}` };
			const account = await testObjects.createTestAccount(credentials, 'local', user);

			const result = await accountRepo.getUserAccount(user._id);
			expect(result).to.not.be.undefined;
			expect(result._id.toString()).to.equal(account._id.toString());
			expect(result).to.haveOwnProperty('username');
			expect(result).to.haveOwnProperty('password');
		});

		it('when no account exists for a user, then null is returned', async () => {
			const userId = ObjectId();
			const result = await accountRepo.getUserAccount(userId);
			expect(result).to.be.null;
		});
	});
});
