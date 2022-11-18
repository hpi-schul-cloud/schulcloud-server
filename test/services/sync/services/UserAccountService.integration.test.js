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
		const createdAccounts = [];
		const createdUsers = [];

		afterEach(async () => {
			const accountPromises = createdAccounts.map((account) => nestAccountService.delete(account));
			await Promise.all(accountPromises);

			const userPromises = createdUsers.map((user) => userModel.remove(user));
			await Promise.all(userPromises);

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

			createdAccounts.push(account);
			createdUsers.push(user);
		});

		it('should throw an error by user creation if email already used', async () => {
			const school = await testObjects.createTestSchool();
			const TEST_ROLE = 'blub21';
			await testObjects.createTestRole({ name: TEST_ROLE, permissions: [] });

			const TEST_EMAIL = `test${Date.now()}@example.com`;

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
			await service.createUserAndAccount(inputUserFirst, inputAccount);

			const secondLdapId = 'newLdapId';
			const inputUserSecond = {
				...inputUser,
				ldapId: secondLdapId,
			};
			try {
				await service.createUserAndAccount(inputUserSecond, inputAccount);
			} catch (error) {
				expect(error).to.be.an.instanceof(BadRequest);
				expect(error.message).to.contain(firstLdapId);
			}
		});
	});

	describe('update user and account', () => {
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
