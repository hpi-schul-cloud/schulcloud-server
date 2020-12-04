const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const userUC = require('./users.uc');

const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');
const errorUtils = require('../../../errors/utils');

const { expect, assert } = chai;
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

const trashBinExample1 = {
	complete: true,
	data: [{ scope: 'scope1', trashbinData: 'some Info' }],
};
const trashBinExample2 = {
	complete: true,
	data: [{ scope: 'scope1', trashbinData: 'some Info' }],
};
const appStub = {
	facadeStubs: {
		facade1: {
			deleteUserData: sinon.stub().returns(trashBinExample1),
		},
		facade2: { deleteUserData: [sinon.stub().returns(trashBinExample1), sinon.stub().returns(trashBinExample2)] },
		errorFacade1: {
			deleteUserData: sinon.stub().throws('some error'),
		},
		errorFacade2: { deleteUserData: [sinon.stub().throws('another error'), sinon.stub().throws('error again')] },
		'/registrationPin/v2': {
			deleteRegistrationPinsByEmail: sinon.stub().returns(trashBinExample2),
		},
	},
	facade(facadeId) {
		return this.facadeStubs[facadeId];
	},
};

let getUserStub;
let getUserAccountStub;
let createUserTrashbinStub;
let updateTrashbinByUserIdStub;
let getUserRolesStub;
let asyncErrorLogStub;

describe('users usecase', () => {
	before(async () => {
		// init stubs
		getUserStub = sinon.stub(userRepo, 'getUser');
		getUserStub.withArgs('NOT_FOUND_USER').returns();
		getUserStub.callsFake((userId = USER_ID) => createTestUser(userId));

		getUserRolesStub = sinon.stub(userRepo, 'getUserRoles');
		getUserRolesStub.withArgs().returns([{ name: 'student' }]);

		sinon.stub(userRepo, 'replaceUserWithTombstone');

		getUserAccountStub = sinon.stub(accountRepo, 'getUserAccount');
		getUserAccountStub.callsFake((userId = USER_ID) => createTestAccount(userId));

		sinon.stub(accountRepo, 'deleteAccountForUserId');

		createUserTrashbinStub = sinon.stub(trashbinRepo, 'createUserTrashbin');
		createUserTrashbinStub.callsFake((userId = USER_ID) => createTestTrashbin(userId));

		updateTrashbinByUserIdStub = sinon.stub(trashbinRepo, 'updateTrashbinByUserId');
		asyncErrorLogStub = sinon.stub(errorUtils, 'asyncErrorLog');
	});
	beforeEach(() => {
		getUserStub.resetHistory();
		getUserRolesStub.resetHistory();
		getUserAccountStub.resetHistory();
		createUserTrashbinStub.resetHistory();
		updateTrashbinByUserIdStub.resetHistory();
		asyncErrorLogStub.resetHistory();
	});

	after(async () => {
		// restore stubbed functions
		getUserStub.restore();
		getUserRolesStub.restore();
		userRepo.replaceUserWithTombstone.restore();
		getUserAccountStub.restore();
		accountRepo.deleteAccountForUserId.restore();
		createUserTrashbinStub.restore();
		updateTrashbinByUserIdStub.restore();
		asyncErrorLogStub.restore();
	});

	describe('user delete orchestrator', () => {
		it('when an authorized admin calls the function, it succeeds', async () => {
			const currentUser = createCurrentUser();
			const testAccount = createTestAccount();
			await userUC.deleteUser(USER_ID, 'student', { account: currentUser, app: appStub });
			expect(createUserTrashbinStub.calledWith(USER_ID, [currentUser, testAccount])).to.be.true;
		});

		it('when the function is called with an invalid id, then it fails', async () => {
			// init stubs
			const currentUser = createCurrentUser();
			const userId = 'NOT_FOUND_USER';
			expect(
				() => userUC.deleteUser(userId, 'student', { account: currentUser, app: appStub }),
				"if user wasn't found it should fail"
			).to.throw;
		});
	});

	describe('deleteUserRelatedData', () => {
		it('should not throw for empty facade list', () => {
			expect(userUC.deleteUserRelatedData('12', appStub, [])).to.not.be.rejected;
		});

		it('should update trashbin correctly if facade.deleteUser is a function', async () => {
			const testUserId = '12';
			await userUC.deleteUserRelatedData(testUserId, appStub, ['facade1']);

			const deleteUserStub = appStub.facadeStubs.facade1.deleteUserData;
			expect(deleteUserStub.callCount).to.be.equal(1);
			expect(deleteUserStub.calledWith(testUserId), 'deleteUser not called with correct userId').to.be.true;
			expect(
				updateTrashbinByUserIdStub.calledWith(testUserId, trashBinExample1.data),
				'updateTrashbinByUser not called with correct params'
			).to.be.true;
		});

		it('should update trashbin correctly if facade.deleteUser is an array of functions', async () => {
			const testUserId = '12';
			await userUC.deleteUserRelatedData(testUserId, appStub, ['facade2']);

			const deleteUserStubs = appStub.facadeStubs.facade2.deleteUserData;
			expect(deleteUserStubs[0].callCount).to.be.equal(1);
			expect(deleteUserStubs[1].callCount).to.be.equal(1);
			expect(deleteUserStubs[0].calledWith(testUserId), 'deleteUser not called with correct userId').to.be.true;
			expect(deleteUserStubs[1].calledWith(testUserId), 'deleteUser not called with correct userId').to.be.true;
			expect(
				updateTrashbinByUserIdStub.calledWith(testUserId, trashBinExample1.data),
				'updateTrashbinByUser not called with correct params'
			).to.be.true;
			expect(
				updateTrashbinByUserIdStub.calledWith(testUserId, trashBinExample2.data),
				'updateTrashbinByUser not called with correct params'
			).to.be.true;
		});

		it('should update trashbin correctly for multiple facades', async () => {
			const testUserId = '12';
			await userUC.deleteUserRelatedData(testUserId, appStub, ['facade1', 'facade2']);

			expect(updateTrashbinByUserIdStub.callCount).to.be.equal(3);
			expect(
				updateTrashbinByUserIdStub.getCall(0).calledWithExactly(testUserId, trashBinExample1.data),
				'updateTrashbinByUser not called with correct params #1'
			).to.be.true;
			expect(
				updateTrashbinByUserIdStub.getCall(1).calledWithExactly(testUserId, trashBinExample1.data),
				'updateTrashbinByUser not called with correct params #2'
			).to.be.true;
			expect(
				updateTrashbinByUserIdStub.getCall(2).calledWithExactly(testUserId, trashBinExample2.data),
				'updateTrashbinByUser not called with correct params #3'
			).to.be.true;
		});

		it('should not throw errors if facades throw, but log facade errors', async () => {
			const testUserId = '12';
			try {
				await userUC.deleteUserRelatedData(testUserId, appStub, ['errorFacade1', 'errorFacade2']);
			} catch (error) {
				assert.fail('deleteUserRelatedData should not have throw');
			}

			expect(asyncErrorLogStub.getCall(0).args[0].name).to.be.equal('some error');
			expect(asyncErrorLogStub.getCall(0).args[1]).to.be.equal('failed to delete user data for facade errorFacade1');
			expect(asyncErrorLogStub.getCall(1).args[0].name).to.be.equal('another error');
			expect(asyncErrorLogStub.getCall(1).args[1]).to.be.equal(
				'failed to delete user data for facade errorFacade2#functionStub'
			);
			expect(asyncErrorLogStub.getCall(2).args[0].name).to.be.equal('error again');
			expect(asyncErrorLogStub.getCall(2).args[1]).to.be.equal(
				'failed to delete user data for facade errorFacade2#functionStub'
			);
		});
	});
});
