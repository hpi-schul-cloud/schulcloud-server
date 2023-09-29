const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;

const UserRepo = require('../../../../src/services/sync/repo/user.repo');
const { userModel } = require('../../../../src/services/user/model');

const { BadRequest } = require('../../../../src/errors');

const { importUserModel } = require('../../../../src/services/sync/model/importUser.schema');

const appPromise = require('../../../../src/app');
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');

const testObjects = require('../../helpers/testObjects')(appPromise());

chai.use(chaiAsPromised);
const { expect } = chai;

describe('user repo', () => {
	let app;
	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	after(async () => {
		await server.close();
		await closeNestServices(nestServices);
	});

	describe('createUser', () => {
		const createdUsers = [];

		afterEach(async () => {
			const userPromises = createdUsers.map((user) => userModel.remove(user));
			await Promise.all(userPromises);

			await testObjects.cleanup();
		});

		it('should successfully create new user', async () => {
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

			const user = await UserRepo.createUser(inputUser, school);
			expect(user._id).to.be.not.undefined;

			expect(user.ldapDn).to.be.not.undefined;
			expect(user.ldapId).to.be.not.undefined;
			expect(user.roles.length).to.be.equal(1);
			expect(user.roles[0]._id.toString()).to.be.equal(role._id.toString());

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

			const firstLdapId = 'initialLdapId';
			const inputUserFirst = {
				...inputUser,
				ldapId: firstLdapId,
			};
			await UserRepo.createUser(inputUserFirst, school);

			const secondLdapId = 'newLdapId';
			const inputUserSecond = {
				...inputUser,
				ldapId: secondLdapId,
			};
			try {
				await UserRepo.createUser(inputUserSecond, school);
			} catch (error) {
				expect(error).to.be.an.instanceof(BadRequest);
				expect(error.errors).to.have.all.keys(
					'userId',
					'ldapId',
					'existsInSchool',
					'userSchool',
					'userSchoolId',
					'existsInSchoolName'
				);
				expect(error.errors.ldapId).to.equal(firstLdapId);
			}
		});
	});
	describe('update user', () => {
		it('should successfully update user', async () => {
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

			const newFirstName = 'new first name';
			const newLastName = 'new last name';
			const user = await UserRepo.updateUser(testUser._id, { firstName: newFirstName, lastName: newLastName });
			expect(user.firstName).to.be.equal(newFirstName);
			expect(user.lastName).to.be.equal(newLastName);
			expect(user.email).to.be.equal(initialEmail);
			expect(user.birthday.toString()).to.be.equal(initialBirthday.toString());
		});

		it('should throw an error by update if email already used', async () => {
			const testEmail = `test${Date.now()}@example.com`;
			const existedEmail = `existed@example.com`;

			await testObjects.createTestUser({ email: existedEmail });
			const testUser = await testObjects.createTestUser({ email: testEmail });

			const newFirstName = 'new first name';
			const newLastName = 'new last name';

			await expect(
				UserRepo.updateUser(testUser._id, { firstName: newFirstName, lastName: newLastName, email: existedEmail })
			).to.be.rejectedWith(BadRequest);
		});
	});

	describe('findByLdapIdAndSchool', () => {
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

	describe('findByPreviousExternalIdAndSchool', () => {
		it('should return null if not found', async () => {
			const testSchool = await testObjects.createTestSchool();
			const res = await UserRepo.findByPreviousExternalIdAndSchool('Not existing id', testSchool._id);
			expect(res).to.be.null;
		});

		it('should find user by previousExternalId and school', async () => {
			const previousExternalId = new ObjectId();
			const school = await testObjects.createTestSchool();
			const testUser = await testObjects.createTestUser({ previousExternalId, schoolId: school._id });
			const res = await UserRepo.findByPreviousExternalIdAndSchool(previousExternalId, school._id);
			expect(res._id.toString()).to.be.equal(testUser._id.toString());
		});
	});

	describe('findByLdapDnsAndSchool', () => {
		it('should return empty list if not found', async () => {
			const testSchool = await testObjects.createTestSchool();
			const res = await UserRepo.findByLdapDnsAndSchool('Not existed dn', testSchool._id);
			expect(res).to.eql([]);
		});

		it('should find user by ldap dn and school', async () => {
			const ldapDns = ['TEST_LDAP_DN', 'TEST_LDAP_DN2'];
			const school = await testObjects.createTestSchool();
			const createdUsers = await Promise.all(
				ldapDns.map((ldapDn) => testObjects.createTestUser({ ldapDn, schoolId: school._id }))
			);
			const res = await UserRepo.findByLdapDnsAndSchool(ldapDns, school._id);
			const user1 = res.filter((user) => createdUsers[0]._id.toString() === user._id.toString());
			const user2 = res.filter((user) => createdUsers[1]._id.toString() === user._id.toString());
			expect(user1).not.to.be.undefined;
			expect(user2).not.to.be.undefined;
		});

		describe('when the user has migrated', () => {
			const setup = async () => {
				const ldapDn = 'TEST_LDAP_DN';
				const school = await testObjects.createTestSchool();
				const user = await testObjects.createTestUser({ previousExternalId: ldapDn, schoolId: school._id });

				return {
					ldapDn,
					user,
					school,
				};
			};

			it('should find the user by its old ldap dn and school', async () => {
				const { ldapDn, school, user } = await setup();

				const res = await UserRepo.findByLdapDnsAndSchool([ldapDn], school._id);

				expect(res.length).to.equal(1);
				expect(res[0]._id.toString()).to.equal(user._id.toString());
			});
		});
	});

	describe('createOrUpdateImportUser', () => {
		it('should create import user', async () => {
			const school = await testObjects.createTestSchool();
			const system = await testObjects.createTestSystem();
			const user = {
				firstName: 'New fname',
				lastName: 'New lname',
				email: 'new email',
				ldapDn: 'new ldapdn',
				ldapId: `ldapId${Math.random()}`,
				roles: ['role1'],
			};
			await UserRepo.createOrUpdateImportUser(school._id, system._id, user.ldapId, user);
			const res = await importUserModel.findOne({ schoolId: school._id, ldapId: user.ldapId }).lean().exec();
			const attributesToCompare = ['firstName', 'lastName', 'email', 'ldapDn'];
			attributesToCompare.forEach((attr) => expect(res[attr]).to.be.equal(user[attr]));
			expect(res.roles).to.eql(user.roles);
		});

		it('should update import user', async () => {
			const testSystem = await testObjects.createTestSystem();
			const school = await testObjects.createTestSchool();
			const importUser = await testObjects.createTestImportUser({
				schoolId: school._id,
				system: testSystem._id,
				firstName: 'foo',
				lastName: 'bar',
				email: 'baz',
				systems: [new ObjectId()],
				roles: ['role1', 'role2'],
			});

			const user = {
				firstName: 'New fname',
				lastName: 'New lname',
				email: 'new email',
				ldapDn: 'new ldapdn',
				ldapId: importUser.ldapId,
				roles: ['role1'],
			};
			await UserRepo.createOrUpdateImportUser(school._id, testSystem._id, user.ldapId, user);
			const res = await importUserModel.find({ schoolId: school._id, ldapId: user.ldapId }).lean().exec();
			expect(res.length).to.equal(1);
			const attributesToCompare = ['firstName', 'lastName', 'email', 'ldapDn'];
			attributesToCompare.forEach((attr) => expect(res[0][attr]).to.be.equal(user[attr]));
			expect(res[0].roles).to.eql(user.roles);
			expect(res[0].system.toString()).to.equal(testSystem._id.toString());
		});
	});

	describe('addClassToImportUsers', () => {
		it('should create class to import users', async () => {
			const testSystem = await testObjects.createTestSystem();
			const school = await testObjects.createTestSchool();
			const importUser = await testObjects.createTestImportUser({ schoolId: school._id, system: testSystem._id });

			const userLdapDns = [importUser.ldapDn];
			const className = '1a';
			await UserRepo.addClassToImportUsers(school._id, className, userLdapDns);

			const res = await importUserModel.findOne({ schoolId: school._id, ldapDn: importUser.ldapDn }).lean().exec();
			expect(res.classNames).to.eql([className]);
		});

		it('should add more classs to import users', async () => {
			const testSystem = await testObjects.createTestSystem();
			const school = await testObjects.createTestSchool();
			const classNames = ['1a', '1b'];
			const importUser = await testObjects.createTestImportUser({
				schoolId: school._id,
				system: testSystem._id,
				classNames,
			});

			const userLdapDns = [importUser.ldapDn];
			const className = '1c';
			await UserRepo.addClassToImportUsers(school._id, className, userLdapDns);

			const res = await importUserModel.findOne({ schoolId: school._id, ldapDn: importUser.ldapDn }).lean().exec();
			expect(res.classNames).to.eql([...classNames, className]);
		});

		it('should not add duplicate class name', async () => {
			const testSystem = await testObjects.createTestSystem();
			const school = await testObjects.createTestSchool();
			const classNames = ['1a', '2b'];
			const importUser = await testObjects.createTestImportUser({
				schoolId: school._id,
				system: testSystem._id,
				classNames,
			});

			const className = ['1a'];
			const userLdapDns = [importUser.ldapDn];
			await UserRepo.addClassToImportUsers(school._id, className, userLdapDns);

			const res = await importUserModel.findOne({ schoolId: school._id, ldapDn: importUser.ldapDn }).lean().exec();
			expect(res.classNames).to.eql(classNames);
		});
	});

	describe('findImportUsersByName', () => {
		it('should resolve importUsers with given firstName and lastName', async () => {
			const testSystem = await testObjects.createTestSystem();
			const school = await testObjects.createTestSchool();
			const importUser = await testObjects.createTestImportUser({
				schoolId: school._id,
				system: testSystem._id,
				firstName: 'jon',
				lastName: 'doe',
			});
			const res = await UserRepo.findImportUsersBySchoolAndName(school._id, importUser.firstName, importUser.lastName);

			expect(res.length).to.equal(1);
			expect(res[0]._id.toString()).to.equal(importUser._id.toString());
		});
		it('should resolve with empty array for no match', async () => {
			const testSystem = await testObjects.createTestSystem();
			const school = await testObjects.createTestSchool();
			const importUser = await testObjects.createTestImportUser({
				schoolId: school._id,
				system: testSystem._id,
				firstName: 'jon',
				lastName: 'doe',
			});

			const wrongFirstNameRes = await UserRepo.findImportUsersBySchoolAndName(school._id, 'jane', importUser.lastName);
			expect(wrongFirstNameRes.length).to.equal(0);

			const wrongLastNameRes = await UserRepo.findImportUsersBySchoolAndName(school._id, importUser.firstName, 'doe2');
			expect(wrongLastNameRes.length).to.equal(0);
		});
	});
	describe('findUserBySchoolAndName', () => {
		it('should resolve importUsers with given firstName and lastName', async () => {
			const school = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({
				schoolId: school._id,
				firstName: 'jon',
				lastName: 'doe',
				email: 'user@test.test',
			});
			const res = await UserRepo.findUserBySchoolAndName(school._id, user.firstName, user.lastName);

			expect(res.length).to.equal(1);
			expect(res[0].firstName).to.equal(user.firstName);
			expect(res[0].lastName).to.equal(user.lastName);
			expect(res[0].email).to.equal(user.email);
			expect(res[0].schoolId.toString()).to.equal(user.schoolId.toString());
		});
		it('should resolve with empty array for no match', async () => {
			const school = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({
				schoolId: school._id,
				firstName: 'jon',
				lastName: 'doe',
			});
			const res = await UserRepo.findUserBySchoolAndName(school._id, 'jane', user.lastName);

			expect(res.length).to.equal(0);
		});
	});
	describe('deleteUser', () => {
		it('should delete an existing user', async () => {
			const school = await testObjects.createTestSchool();
			const testUserEmail = 'user@test.test';
			const user = await testObjects.createTestUser(
				{
					schoolId: school._id,
					firstName: 'jon',
					lastName: 'doe',
					email: testUserEmail,
				},
				{ manualCleanup: true }
			);

			let res = await UserRepo.findUserBySchoolAndName(school._id, user.firstName, user.lastName);
			expect(res.length).to.equal(1);

			await UserRepo.deleteUser(user._id);

			res = await UserRepo.findUserBySchoolAndName(school._id, user.firstName, user.lastName);
			expect(res.length).to.equal(0);
		});
	});
});
