const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const appPromise = require('../../../app');
const userUC = require('./users.uc');

const { userRepo, accountRepo, trashbinRepo, registrationPinRepo } = require('../repo/index');

const { expect } = chai;
chai.use(chaiAsPromised);

const USER_ID = 'USER_ID';
const USER_EMAIL = 'delete_me@test.de';
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
		email: USER_EMAIL,
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

const createRegistrationPins = (email = USER_EMAIL) => {
	return [
		{
			_id: 'REGISTRATION_PIN_ID',
			email,
			pin: 'USER_PIN',
			verified: true,
			importHash: 'USER_IMPORT_HASH',
		},
	];
};

const createTestTrashbin = (userId) => {
	return {
		_id: 'TRASHBIN_ID',
		userId,
		user: createTestUser(userId),
		account: createTestAccount(userId),
		registrationPins: createRegistrationPins(USER_EMAIL),
	};
};

let getUserStub;
let getUserAccountStub;
let findStub;
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

		findStub = sinon.stub(registrationPinRepo, 'find');
		findStub.callsFake((email = USER_EMAIL) => createRegistrationPins(email));

		// sinon.stub(registrationPinRepo, 'delete');

		createUserTrashbinStub = sinon.stub(trashbinRepo, 'createUserTrashbin');
		createUserTrashbinStub.callsFake((userId = USER_ID) => createTestTrashbin(userId));
	});

	after(async () => {
		// restore stubbed functions
		getUserStub.restore();
		userRepo.replaceUserWithTombstone.restore();
		getUserAccountStub.restore();
		accountRepo.deleteUserAccount.restore();
		findStub.restore();
		// registrationPinRepo.delete.restore();
		createUserTrashbinStub.restore();

		await server.close();
	});

	describe('user delete orchestrator', () => {
		it('should successfully mark user for deletion', async () => {
			// act
			const currentUser = createCurrentUser();
			const result = await userUC.deleteUser(USER_ID, 'student', { account: currentUser, app });

			expect(result.userId).to.deep.equal(USER_ID);
			expect(result).to.deep.equal(createTestTrashbin(USER_ID));
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
