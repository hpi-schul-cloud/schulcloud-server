const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const userUC = require('./users.uc');

const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');
const errorUtils = require('../../../errors/utils');
const { facadeLocator } = require('../../../utils/facadeLocator');
const { trashBinResult } = require('../../helper/uc.helper');

const { expect, assert } = chai;
chai.use(chaiAsPromised);
chai.use(sinonChai);

const USER_ID = new ObjectId();
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

const trashBinExample1 = trashBinResult({ scope: 'scope1', data: 'some Info', complete: true });
const trashBinExample2 = trashBinResult({ scope: 'scope1', data: 'some Info', complete: true });

const facadeStubs = {
	facade1: {
		deleteUserData: [sinon.stub().returns(trashBinExample1)],
	},
	facade2: { deleteUserData: [sinon.stub().returns(trashBinExample1), sinon.stub().returns(trashBinExample2)] },
	errorFacade1: {
		deleteUserData: [sinon.stub().throws('some error')],
	},
	errorFacade2: { deleteUserData: [sinon.stub().throws('another error'), sinon.stub().throws('error again')] },
	'/registrationPin/v2': {
		deleteRegistrationPinsByEmail: [sinon.stub().returns(trashBinExample2)],
	},
	'/school/v2': {
		getSchool: sinon.stub().returns({ name: 'dummy school', tombstoneUserId: 'dummy-id' }),
		// getTombstoneSchool
		// updateSchool
	},
};

let getUserStub;
let getUserAccountStub;
let createUserTrashbinStub;
let updateTrashbinByUserIdStub;
let getUserRolesStub;
let asyncErrorLogStub;

describe('users usecase', () => {
	beforeEach(async () => {
		// init stubs
		getUserStub = sinon.stub(userRepo, 'getUser');
		getUserStub.withArgs('NOT_FOUND_USER').returns();
		getUserStub.callsFake((userId = USER_ID) => createTestUser(userId));

		getUserRolesStub = sinon.stub(userRepo, 'getUserWithRoles');
		getUserRolesStub.withArgs().returns({ roles: [{ name: 'student' }] });

		sinon.stub(userRepo, 'replaceUserWithTombstone');

		getUserAccountStub = sinon.stub(accountRepo, 'getUserAccount');
		getUserAccountStub.callsFake((userId = USER_ID) => createTestAccount(userId));

		sinon.stub(accountRepo, 'deleteAccountForUserId');

		createUserTrashbinStub = sinon.stub(trashbinRepo, 'createUserTrashbin');
		createUserTrashbinStub.callsFake((userId = USER_ID) => createTestTrashbin(userId));

		updateTrashbinByUserIdStub = sinon.stub(trashbinRepo, 'updateTrashbinByUserId');
		asyncErrorLogStub = sinon.stub(errorUtils, 'asyncErrorLog');

		// eslint-disable-next-line guard-for-in
		for (const [key, facade] of Object.entries(facadeStubs)) {
			facadeLocator.registerFacade(key, facade);
		}
	});

	afterEach(sinon.restore);

	describe('user delete orchestrator', () => {
		it('when an authorized admin calls the function, it succeeds', async () => {
			const currentUser = createCurrentUser();
			const testUser = createTestUser();
			const testAccount = createTestAccount();
			await userUC.deleteUser(USER_ID, 'student', { account: currentUser });
			expect(createUserTrashbinStub).to.have.been.calledWith(USER_ID, [
				{ scope: 'user', data: testUser },
				{ scope: 'account', data: testAccount },
			]);
		});

		it('when the function is called with an invalid id, then it fails', async () => {
			const currentUser = createCurrentUser();
			const userId = 'NOT_FOUND_USER';
			expect(
				() => userUC.deleteUser(userId, 'student', { account: currentUser }),
				"if user wasn't found it should fail"
			).to.throw;
		});
	});

	describe('deleteUserRelatedData', () => {
		it('should not throw for empty facade list', () => {
			expect(userUC.deleteUserRelatedData('12', 'tombstoneUserId', [])).to.not.be.rejected;
		});

		it('should update trashbin correctly if facade.deleteUser is a function', async () => {
			const testUserId = '12';
			await userUC.deleteUserRelatedData(testUserId, 'tombstoneUserId', ['facade1']);

			const deleteUserStub = facadeStubs.facade1.deleteUserData[0];
			expect(deleteUserStub.callCount).to.be.equal(1);
			expect(deleteUserStub.calledWith(testUserId), 'deleteUser not called with correct userId').to.be.true;
			expect(
				updateTrashbinByUserIdStub.calledWith(testUserId, trashBinExample1.trashBinData),
				'updateTrashbinByUser not called with correct params'
			).to.be.true;
		});

		it('should update trashbin correctly if facade.deleteUser is an array of functions', async () => {
			const testUserId = '12';
			await userUC.deleteUserRelatedData(testUserId, 'tombstoneUserId', ['facade2']);

			const deleteUserStubs = facadeStubs.facade2.deleteUserData;
			expect(deleteUserStubs[0].callCount).to.be.equal(1);
			expect(deleteUserStubs[1].callCount).to.be.equal(1);
			expect(deleteUserStubs[0].calledWith(testUserId), 'deleteUser not called with correct userId').to.be.true;
			expect(deleteUserStubs[1].calledWith(testUserId), 'deleteUser not called with correct userId').to.be.true;
			expect(
				updateTrashbinByUserIdStub.calledWith(testUserId, trashBinExample1.trashBinData),
				'updateTrashbinByUser not called with correct params'
			).to.be.true;
			expect(
				updateTrashbinByUserIdStub.calledWith(testUserId, trashBinExample2.trashBinData),
				'updateTrashbinByUser not called with correct params'
			).to.be.true;
		});

		it('should update trashbin correctly for multiple facades', async () => {
			const testUserId = '12';
			await userUC.deleteUserRelatedData(testUserId, 'tombstoneUserId', ['facade1', 'facade2']);

			expect(updateTrashbinByUserIdStub.callCount).to.be.equal(3);
			expect(
				updateTrashbinByUserIdStub.getCall(0).calledWithExactly(testUserId, trashBinExample1.trashBinData),
				'updateTrashbinByUser not called with correct params #1'
			).to.be.true;
			expect(
				updateTrashbinByUserIdStub.getCall(1).calledWithExactly(testUserId, trashBinExample1.trashBinData),
				'updateTrashbinByUser not called with correct params #2'
			).to.be.true;
			expect(
				updateTrashbinByUserIdStub.getCall(2).calledWithExactly(testUserId, trashBinExample2.trashBinData),
				'updateTrashbinByUser not called with correct params #3'
			).to.be.true;
		});

		it('should not throw errors if facades throw, but log facade errors', async () => {
			const testUserId = '12';
			try {
				await userUC.deleteUserRelatedData(testUserId, 'tombstoneUserId', ['errorFacade1', 'errorFacade2']);
			} catch (error) {
				assert.fail('deleteUserRelatedData should not have throw');
			}

			expect(asyncErrorLogStub.getCall(0).args[0].name).to.be.equal('some error');
			expect(asyncErrorLogStub.getCall(0).args[1]).to.be.equal(
				'failed to delete user data for facade errorFacade1#functionStub'
			);
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
