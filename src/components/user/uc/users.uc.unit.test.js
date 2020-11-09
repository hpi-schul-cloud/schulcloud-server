const sinon = require('sinon');

const { expect } = require('chai');
const { deleteUserUC, replaceUserWithTombstoneUC } = require('./users.uc');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');

const USER_ID = 'USER_ID';

const createTestUser = (userId) => {
	return {
		_id: userId,
		firstName: 'Max',
		lastName: 'Mustermann',
		email: `delete_me@test.de`,
		schoolId: 'SCHOOL_ID',
		roles: [],
	};
};

const createTestAccount = (user) => {
	return {
		_id: 'ACCOUNT_ID',
		userId: user._id,
		username: user.email,
		password: 'PASSWORD',
	};
};

const createTestTrashbin = (userId, data) => {
	return {
		_id: 'TRASHBIN_ID',
		userId,
		...data,
	};
};

let getUserStub;
let getUserAccountStub;
let createUserTrashbinStub;

describe('users usecase', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);

		const user = createTestUser(USER_ID);
		const account = createTestAccount(user);
		const trashbin = createTestTrashbin(user._id, { user, account });

		// init stubs
		getUserStub = sinon.stub(userRepo, 'getUser');
		getUserStub.withArgs(USER_ID).returns(user);
		sinon.stub(userRepo, 'replaceUserWithTombstone');

		getUserAccountStub = sinon.stub(accountRepo, 'getUserAccount');
		getUserAccountStub.withArgs(USER_ID).returns(account);

		sinon.stub(accountRepo, 'deleteUserAccount');
		createUserTrashbinStub = sinon.stub(trashbinRepo, 'createUserTrashbin');
		createUserTrashbinStub.withArgs(USER_ID).returns(trashbin);
	});

	after(async () => {
		// restore stubbed functions
		getUserStub.restore();
		userRepo.replaceUserWithTombstone.restore();
		getUserAccountStub.restore();
		accountRepo.deleteUserAccount.restore();
		createUserTrashbinStub.restore();

		await server.close();
	});

	describe('user replace with tombstone orchestrator', () => {
		it('when the function is called, then it returns (replace with useful test)', async () => {
			const user = await testObjects.createTestUser();
			const result = await replaceUserWithTombstoneUC(user._id, app);
			expect(result).to.deep.equal({ success: true });
		});
	});

	describe('user delete orchestrator', () => {
		it('should successfully mark user for deletion', async () => {
			// act
			const result = await deleteUserUC(USER_ID, app);

			expect(result).to.deep.equal({ success: true });
		});

		it('should return not found if user cannot be found', async () => {
			// init stubs
			const userId = 'NOT_FOUND_USER';
			getUserStub.withArgs(userId);
			expect(() => deleteUserUC(userId, app), "if user wasn't found it should fail").to.throw;
		});

		it("should return error if trashbin couldn't be created", async () => {
			// init stubs
			const userId = 'USER_ID_2';
			const user = createTestUser(userId);
			const account = createTestAccount(user);

			// init stubs
			getUserStub.withArgs(userId).returns(user);
			getUserAccountStub.withArgs(userId).returns(account);
			createUserTrashbinStub.withArgs(userId);

			expect(() => deleteUserUC(userId, app), "if trashbin couldn't be created it should fail").to.throw;
		});
	});
});
