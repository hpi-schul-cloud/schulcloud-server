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

const createTestAccount = (userId = USER_ID) => {
	const user = createTestUser(userId);
	return {
		_id: 'ACCOUNT_ID',
		userId: user._id,
		username: user.email,
		password: 'PASSWORD',
	};
};

const createTestTrashbin = (userId = USER_ID) => {
	const user = createTestUser(userId);
	const account = createTestAccount(userId);
	return {
		_id: 'TRASHBIN_ID',
		userId,
		user,
		account,
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

		// init stubs
		getUserStub = sinon.stub(userRepo, 'getUser');
		getUserStub.withArgs('NOT_FOUND_USER').returns();
		getUserStub.callsFake((userId = USER_ID) => createTestUser(userId));

		getUserRolesStub = sinon.stub(userRepo, 'getUserRoles');
		getUserRolesStub.withArgs().returns([{ name: 'student' }]);

		sinon.stub(userRepo, 'replaceUserWithTombstone');

		getUserAccountStub = sinon.stub(accountRepo, 'getUserAccount');
		getUserAccountStub.callsFake((userId = USER_ID) => createTestAccount(userId));

		sinon.stub(accountRepo, 'deleteUserAccount');

		createUserTrashbinStub = sinon.stub(trashbinRepo, 'createUserTrashbin');
		createUserTrashbinStub.callsFake((userId = USER_ID) => createTestTrashbin(userId));
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
			const result = await userUC.deleteUser(USER_ID, 'student', { account: currentUser, app });

			expect(result.userId).to.deep.equal(USER_ID);
		});

		it('should return not found if user cannot be found', async () => {
			// init stubs
			const currentUser = createCurrentUser();
			const userId = 'NOT_FOUND_USER';
			expect(
				() => userUC.deleteUser(userId, 'student', { account: currentUser, app }),
				"if user wasn't found it should fail"
			).to.throw;
		});
	});
});
