const chai = require('chai');
const chaiHttp = require('chai-http');

const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise());
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');
const { userModel } = require('../../../../src/services/user/model');

chai.use(chaiHttp);
const { expect } = chai;

const { BadRequest } = require('../../../../src/errors');

describe('UserAccountService integration', () => {
	let app;
	let nestServices;
	let nestAccountService;
	let server;

	let service;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
		nestAccountService = app.service('nest-account-service');
		service = app.service('/sync/userAccount');
	});

	after(async () => {
		await server.close();
		await closeNestServices(nestServices);
	});

	describe('createUserAndAccountc', () => {
		let createdAccount;
		let createdUser;

		afterEach(async () => {
			if (createdAccount) {
				await nestAccountService.delete(createdAccount.id);
				createdAccount = undefined;
			}

			if (createdUser) {
				await userModel.remove(createdUser);
				createdUser = undefined;
			}

			await testObjects.cleanup();
		});

		it('should successfully create new user and account', async () => {
			const school = await testObjects.createTestSchool();
			const TEST_ROLE = 'blub21';
			const role = await testObjects.createTestRole({ name: TEST_ROLE, permissions: [] });
			const email = `max${`${Date.now()}`}@mustermann.de`;
			const inputUser = {
				firstName: 'Max',
				lastName: 'Mustermann',
				email,
				schoolId: school._id,
				ldapDn: 'Test ldap',
				ldapId: 'Test ldapId',
				roles: [TEST_ROLE],
			};
			const inputAccount = {
				username: email,
			};
			const { user, account } = await service.createUserAndAccount(inputUser, inputAccount);
			expect(user._id).to.be.not.undefined;
			expect(account.userId.toString()).to.be.equal(user._id.toString());
			expect(account.activated).to.be.true;
			expect(user.ldapDn).to.be.not.undefined;
			expect(user.ldapId).to.be.not.undefined;
			expect(user.roles.length).to.be.equal(1);
			expect(user.roles[0]._id.toString()).to.be.equal(role._id.toString());

			createdAccount = account;
			createdUser = user;
		});

		it('should throw an error by user creation if email already used', async () => {
			const school = await testObjects.createTestSchool();
			const TEST_ROLE = 'blub21';
			await testObjects.createTestRole({ name: TEST_ROLE, permissions: [] });

			const TEST_EMAIL = `test1234-${Date.now()}@example.com`;

			const inputUser = {
				firstName: 'Max',
				lastName: 'Mustermann',
				email: TEST_EMAIL,
				schoolId: school._id,
				ldapDn: 'Test ldap',
				roles: [TEST_ROLE],
			};
			const inputAccount = {
				username: TEST_EMAIL,
			};

			const firstLdapId = 'initialLdapId';
			const inputUserFirst = {
				...inputUser,
				ldapId: firstLdapId,
			};
			const { user, account } = await service.createUserAndAccount(inputUserFirst, inputAccount);
			createdUser = user;
			createdAccount = account;

			const secondLdapId = 'newLdapId';
			const inputUserSecond = {
				...inputUser,
				ldapId: secondLdapId,
			};
			await expect(service.createUserAndAccount(inputUserSecond, inputAccount))
				.to.be.rejectedWith(BadRequest)
				.and.to.eventually.have.property('message')
				.and.to.eventually.contain(firstLdapId);
		});

		it('should not create user if account creation fails', async () => {
			const school = await testObjects.createTestSchool();
			const TEST_ROLE = 'blub21';
			await testObjects.createTestRole({ name: TEST_ROLE, permissions: [] });
			const testEmail = `test${Date.now()}@example.com`;
			const systemId = 'B5AACFD199822D4534DB6C98';

			const testUser = await testObjects.createTestUser({ email: testEmail });
			const password = 'password123';
			const credentials = { username: testUser.email, password };
			await testObjects.createTestAccount(credentials, 'local', testUser);

			const inputUserOk = {
				firstName: 'Max2',
				lastName: 'Mustermann2',
				email: `${testEmail}2`,
				schoolId: school._id,
				ldapDn: 'Test ldap',
				roles: [TEST_ROLE],
			};

			await expect(service.createUserAndAccount(inputUserOk, {})).to.be.rejected;

			const foundUsers = await userModel.find({ email: `${testEmail}2` }).exec();
			expect(foundUsers.length).to.be.equal(0);

			const foundAccount = await nestAccountService.findByUsernameAndSystemId(testEmail, systemId);
			expect(foundAccount).to.be.null;
		});

		it('should not create account if user creation fails', async () => {
			const testEmail = `test${Date.now()}@example.com`;
			const systemId = 'B5AACFD199822D4534DB6C98';

			const testUser = await testObjects.createTestUser({ email: testEmail });
			const password = 'password123';
			const credentials = { username: testUser.email, password };
			await testObjects.createTestAccount(credentials, 'local', testUser);

			const inputAccountOK = {
				username: `${testEmail}2`,
				systemId,
			};

			await expect(service.createUserAndAccount({}, inputAccountOK)).to.be.rejectedWith(BadRequest);

			const foundAccount = await nestAccountService.findByUsernameAndSystemId(`${testEmail}2`, systemId);
			expect(foundAccount).to.be.null;
		});
	});

	describe('update user and account', () => {
		afterEach(async () => {
			await testObjects.cleanup();
		});

		it('should successfully update user and account', async () => {
			const initialFirstName = 'Initial Fname';
			const initialLastName = 'Initial Lname';
			const initialEmail = 'initial@email.com';
			const initialBirthday = new Date();
			const testUser = await testObjects.createTestUser({
				firstName: initialFirstName,
				lastName: initialLastName,
				birthday: initialBirthday,
				email: initialEmail,
			});
			const password = 'password123';
			const credentials = { username: testUser.email, password };
			await testObjects.createTestAccount(credentials, 'local', testUser);

			const newFirstName = 'new first name';
			const newLastName = 'new last name';
			const newUserName = 'new user name';
			const { user, account } = await service.updateUserAndAccount(
				testUser._id,
				{ firstName: newFirstName, lastName: newLastName },
				{ username: newUserName }
			);
			expect(user.firstName).to.be.equal(newFirstName);
			expect(user.lastName).to.be.equal(newLastName);
			expect(account.username).to.be.equal(newUserName);
			expect(user.email).to.be.equal(initialEmail);
			expect(user.birthday.toString()).to.be.equal(initialBirthday.toString());
		});

		it('should throw an error by update if email already used', async () => {
			const testEmail = `test${Date.now()}@example.com`;
			const existedEmail = `existed@example.com`;

			await testObjects.createTestUser({ email: existedEmail });
			const testUser = await testObjects.createTestUser({ email: testEmail });
			const password = 'password123';
			const credentials = { username: testUser.email, password };
			await testObjects.createTestAccount(credentials, 'local', testUser);

			const newFirstName = 'new first name';
			const newLastName = 'new last name';
			const newUserName = 'new user name';
			await expect(
				service.updateUserAndAccount(
					testUser._id,
					{ firstName: newFirstName, lastName: newLastName, email: existedEmail },
					{ username: newUserName }
				)
			).to.be.rejectedWith(BadRequest);
		});
	});
});
