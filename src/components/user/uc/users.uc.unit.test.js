const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const appPromise = require('../../../app');
const userUC = require('./users.uc');

const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');

const { expect } = chai;
chai.use(chaiAsPromised);

const USER_ID = 'USER_ID';
const CURRENT_USER_ID = 'CURRENT_USER_ID';
const CURRENT_SCHOOL_ID = new ObjectId();

const createCurrentUser = (userId = CURRENT_USER_ID) => {
	return {
		_id: userId,
		userId,
		firstName: 'Admin',
		lastName: 'Admin',
		email: `admin@test.de`,
		schoolId: CURRENT_SCHOOL_ID,
		roles: [],
	};
};

const createTestUser = (userId = USER_ID) => {
	return {
		_id: userId,
		firstName: 'Max',
		lastName: 'Mustermann',
		email: `delete_me@test.de`,
		schoolId: CURRENT_SCHOOL_ID,
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
let getUserRolesStub;

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
		getUserStub.withArgs(CURRENT_USER_ID).returns(user);

		getUserRolesStub = sinon.stub(userRepo, 'getUserRoles');
		getUserRolesStub.withArgs().returns([{ name: 'student' }]);

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

	describe('user delete orchestrator', () => {
		it('should successfully mark user for deletion', async () => {
			// act
			const currentUser = createCurrentUser();
			const result = await userUC.deleteUserUC(USER_ID, 'student', { account: currentUser, app });

			expect(result.userId).to.deep.equal(USER_ID);
		});

		it('should return not found if user cannot be found', async () => {
			// init stubs
			const userId = 'NOT_FOUND_USER';
			getUserStub.withArgs(userId);
			expect(() => userUC.deleteUserUC(userId, 'student'), "if user wasn't found it should fail").to.throw;
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

			expect(() => userUC.deleteUserUC(userId, 'student', { account, app }), "if trashbin couldn't be created it should fail").to
				.throw;
		});
	});
});
