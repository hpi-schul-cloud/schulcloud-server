const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;

const UserRepo = require('../../../../src/services/sync/repo/user.repo');

const accountModel = require('../../../../src/services/account/model');
const { userModel } = require('../../../../src/services/user/model');

const appPromise = require('../../../../src/app');

const testObjects = require('../../helpers/testObjects')(appPromise);

chai.use(chaiAsPromised);
const { expect } = chai;

describe('user repo', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	beforeEach(async () => {});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	after(async () => {
		await server.close();
	});

	it('should successfully create new user and account', async () => {
		const school = await testObjects.createTestSchool();
		const email = `max${`${Date.now()}`}@mustermann.de`;
		const inputUser = {
			firstName: 'Max',
			lastName: 'Mustermann',
			email,
			schoolId: school._id,
			ldapDn: 'Test ldap',
			ldapId: 'Test ldapId',
		};
		const inputAccount = {
			username: email,
		};
		const { user, account } = await UserRepo.createUserAndAccount(inputUser, inputAccount);
		expect(user._id).to.be.not.undefined;
		expect(account.userId.toString()).to.be.equal(user._id.toString());
		expect(account.activated).to.be.true;
		expect(user.ldapDn).to.be.not.undefined;
		expect(user.ldapId).to.be.not.undefined;

		await accountModel.remove(account);
		await userModel.remove(user);
	});

	it('should successfully update user and account', async () => {
		const testUser = await testObjects.createTestUser({});
		const password = 'password123';
		const credentials = { username: testUser.email, password };
		await testObjects.createTestAccount(credentials, 'local', testUser);

		const newFirstName = 'new first name';
		const newLastName = 'new last name';
		const newUserName = 'new user name';
		const { user, account } = await UserRepo.updateUserAndAccount(
			testUser._id,
			{ firstName: newFirstName, lastName: newLastName },
			{ username: newUserName }
		);
		expect(user.firstName).to.be.equal(newFirstName);
		expect(user.lastName).to.be.equal(newLastName);
		expect(account.username).to.be.equal(newUserName);
	});

	it('should return null if not found', async () => {
		const testSchool = await testObjects.createTestSchool();
		const res = await UserRepo.findByLdapIdAndSchool('Not existed dn', testSchool._id);
		expect(res).to.be.null;
	});

	it('should find user by ldap and school', async () => {
		const ldapId = new ObjectId();
		const school = await testObjects.createTestSchool();
		const testUser = await testObjects.createTestUser({ ldapId, schoolId: school._id });
		const res = await UserRepo.findByLdapIdAndSchool(ldapId, school._id);
		expect(res._id.toString()).to.be.equal(testUser._id.toString());
	});
});
