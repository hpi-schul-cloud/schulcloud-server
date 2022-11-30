const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;

const { BadRequest, NotFound } = require('../../../../../src/errors');
const { UserAction } = require('../../../../../src/services/sync/strategies/consumerActions');

const { SchoolRepo, UserRepo } = require('../../../../../src/services/sync/repo');

const { expect } = chai;
chai.use(chaiAsPromised);

describe('User Actions', () => {
	let userAction;
	before(() => {
		userAction = new UserAction(true);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('action: ', () => {
		it('should create user and account if not exists', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			const testSchoolId = new ObjectId();
			findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School', _id: testSchoolId });

			const findByLdapIdAndSchoolStub = sinon.stub(UserRepo, 'findByLdapIdAndSchool');
			findByLdapIdAndSchoolStub.returns(null);

			const createUserAndAccountStub = sinon.stub(UserRepo, 'createUserAndAccount');

			const testUserInput = { _id: 1 };
			const testAccountInput = { _id: 2 };
			await userAction.action({ user: testUserInput, account: testAccountInput });

			const firstArg = createUserAndAccountStub.firstCall.args[0];
			const secondArg = createUserAndAccountStub.firstCall.args[1];

			expect(createUserAndAccountStub.calledOnce).to.be.true;
			expect(firstArg.schoolId).to.be.equal(testSchoolId);
			expect(firstArg._id).to.be.equal(testUserInput._id);
			expect(secondArg._id).to.be.equal(testAccountInput._id);
		});

		it('should update user and account if exists', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			const testSchoolId = new ObjectId();
			findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School', _id: testSchoolId });

			const findByLdapIdAndSchoolStub = sinon.stub(UserRepo, 'findByLdapIdAndSchool');
			const existingUser = {
				_id: 1,
				firstName: 'Old fname',
				lastName: 'Old lname',
				email: 'Old email',
				ldapDn: 'Old ldapdn',
			};
			findByLdapIdAndSchoolStub.returns(existingUser);

			const updateUserAndAccountStub = sinon.stub(UserRepo, 'updateUserAndAccount');

			const testUserInput = {
				_id: 1,
				firstName: 'New fname',
				lastName: 'New lname',
				email: 'New email',
				ldapDn: 'new ldapdn',
				roles: [new ObjectId()],
			};
			const testAccountInput = { _id: 2 };
			await userAction.action({ user: testUserInput, account: testAccountInput });

			expect(updateUserAndAccountStub.calledOnce).to.be.true;

			const { args } = updateUserAndAccountStub.firstCall;
			const updateUserArg = args[1];

			expect(args[0]).to.be.equal(testUserInput._id);
			expect(updateUserArg.firstName).to.be.equal(testUserInput.firstName);
			expect(updateUserArg.lastName).to.be.equal(testUserInput.lastName);
			expect(updateUserArg.email).to.be.equal(testUserInput.email);
			expect(updateUserArg.ldapDn).to.be.equal(testUserInput.ldapDn);
			expect(updateUserArg.roles).to.be.equal(testUserInput.roles);

			expect(args[2]).to.be.equal(testAccountInput);
		});

		it('should throw a sync error if user repo throws an error', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School' });

			const findByLdapIdAndSchoolStub = sinon.stub(UserRepo, 'findByLdapIdAndSchool');
			findByLdapIdAndSchoolStub.throws(new BadRequest('class repo error'));

			await expect(userAction.action({ user: {}, account: {} })).to.be.rejectedWith(BadRequest);
		});

		it('should throw an error if school could not be found', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			findSchoolByLdapIdAndSystemStub.returns(null);
			await expect(userAction.action({ class: { schoolDn: 'SCHOOL_DN', systemId: '' } })).to.be.rejectedWith(NotFound);
		});

		describe('When school is in maintenance mode', () => {
			it('should not create user and account', async () => {
				const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
				findSchoolByLdapIdAndSystemStub.returns({ name: 'Test Schhol', inMaintenance: true });

				const createUserSpy = sinon.spy(UserRepo, 'createUserAndAccount');

				sinon.stub(UserRepo, 'findByLdapIdAndSchool').returns(null);

				const testUserInput = {
					_id: 1,
					firstName: 'New fname',
					lastName: 'New lname',
					email: 'New email',
					ldapDn: 'new ldapdn',
					roles: [new ObjectId()],
				};
				const testAccountInput = { _id: 2 };
				await userAction.action({ user: testUserInput, account: testAccountInput });

				expect(createUserSpy.notCalled).to.be.true;
			});

			it('should not update user and account', async () => {
				const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
				findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School', inMaintenance: true });

				const existingUser = {
					_id: 1,
					firstName: 'Old fname',
					lastName: 'Old lname',
					email: 'Old email',
					ldapDn: 'Old ldapdn',
				};
				sinon.stub(UserRepo, 'findByLdapIdAndSchool').returns(existingUser);

				const updateUserSpy = sinon.spy(UserRepo, 'updateUserAndAccount');

				const testUserInput = {
					_id: 1,
					firstName: 'New fname',
					lastName: 'New lname',
					email: 'New email',
					ldapDn: 'new ldapdn',
					roles: [new ObjectId()],
				};
				const testAccountInput = { _id: 2 };
				await userAction.action({ user: testUserInput, account: testAccountInput });

				expect(updateUserSpy.notCalled).to.be.true;
			});
		});

		describe('When school is use migration mode', () => {
			it('should persist ldap user data for migration', async () => {
				const schoolId = 'foo';
				sinon
					.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem')
					.resolves({ _id: schoolId, name: 'Test School', inUserMigration: true });
				sinon.stub(UserRepo, 'findByLdapIdAndSchool').resolves(null);
				const createUserAndAccountStub = sinon.stub(UserRepo, 'createUserAndAccount');
				const updateUserAndAccountStub = sinon.stub(UserRepo, 'updateUserAndAccount');
				const createOrUpdateImportUserStub = sinon.stub(UserRepo, 'createOrUpdateImportUser');
				const autoMatchImportUserStub = sinon.stub(userAction, 'autoMatchImportUser');

				const testUserInput = {
					_id: 1,
					firstName: 'New fname',
					lastName: 'New lname',
					email: 'New email',
					ldapDn: 'new ldapdn',
					ldapId: 'new ldapId',
					roles: ['role1'],
					systemId: 'id of system',
				};
				const testAccountInput = { _id: 2 };
				await userAction.action({ user: testUserInput, account: testAccountInput });

				expect(updateUserAndAccountStub.notCalled).to.be.true;
				expect(createUserAndAccountStub.notCalled).to.be.true;
				expect(createOrUpdateImportUserStub.calledOnce).to.be.true;
				expect(autoMatchImportUserStub.calledOnce).to.be.true;

				const expectedUserObject = {
					firstName: 'New fname',
					lastName: 'New lname',
					email: 'New email',
					ldapDn: 'new ldapdn',
					roles: ['role1'],
				};
				expect(
					createOrUpdateImportUserStub.calledWith(
						schoolId,
						testUserInput.systemId,
						testUserInput.ldapId,
						expectedUserObject
					)
				).to.be.true;
				expect(autoMatchImportUserStub.calledWith(schoolId, expectedUserObject)).to.be.true;
			});

			it('should not update or create import user, when user has an ldap', async () => {
				sinon
					.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem')
					.resolves({ name: 'Test School', inUserMigration: true, inMaintenance: true });
				const userId = new ObjectId();
				const existingUser = {
					_id: userId,
					firstName: 'Old fname',
					lastName: 'Old lname',
					email: 'Old email',
					ldapDn: 'Old ldapdn',
				};
				sinon.stub(UserRepo, 'findByLdapIdAndSchool').resolves(existingUser);

				const createOrUpdateImportUserStub = sinon.stub(UserRepo, 'createOrUpdateImportUser');

				const testUserInput = {
					_id: new ObjectId(),
					firstName: 'New fname',
					lastName: 'New lname',
					email: 'New email',
					ldapDn: 'new ldapdn',
					roles: ['role1'],
				};
				const testAccountInput = { _id: 2 };
				await userAction.action({ user: testUserInput, account: testAccountInput });

				expect(createOrUpdateImportUserStub.notCalled).to.be.true;
			});
		});
	});
	describe('autoMatchImportUser', () => {
		let findUserBySchoolAndNameStub;
		let findImportUsersBySchoolAndNameStub;
		let createOrUpdateImportUserStub;

		beforeEach(() => {
			findUserBySchoolAndNameStub = sinon.stub(UserRepo, 'findUserBySchoolAndName');
			findImportUsersBySchoolAndNameStub = sinon.stub(UserRepo, 'findImportUsersBySchoolAndName');
			createOrUpdateImportUserStub = sinon.stub(UserRepo, 'createOrUpdateImportUser');
		});

		it('should not create match, when firstName or lastName are empty', async () => {
			const schoolId = 'foo';
			const userUpdateObject1 = {
				firstName: ' ',
				lastName: 'doe',
			};
			const userUpdateObject2 = {
				firstName: 'john',
				lastName: '',
			};

			await userAction.autoMatchImportUser(schoolId, userUpdateObject1);
			expect(userUpdateObject1.match).to.be.undefined;

			await userAction.autoMatchImportUser(schoolId, userUpdateObject2);
			expect(userUpdateObject2.match).to.be.undefined;
		});

		it('should not create match, when no local user is found', async () => {
			const schoolId = 'foo';
			const userUpdateObject = {
				firstName: 'john',
				lastName: 'doe',
			};
			findUserBySchoolAndNameStub.resolves([]);
			await userAction.autoMatchImportUser(schoolId, userUpdateObject);
			expect(userUpdateObject.match).to.be.undefined;
		});

		it('should not create match, when multiple local user are found', async () => {
			const schoolId = 'foo';
			const userUpdateObject = {
				firstName: 'john',
				lastName: 'doe',
			};
			findUserBySchoolAndNameStub.resolves(['dummyUser1', 'dummyUser2', 'dummyUser3']);
			await userAction.autoMatchImportUser(schoolId, userUpdateObject);
			expect(userUpdateObject.match).to.be.undefined;
		});

		it('should create match, when only 1 local user is found', async () => {
			const schoolId = 'foo';
			const userUpdateObject = {
				firstName: 'john',
				lastName: 'doe',
			};
			const localUserId = 'bar';
			findUserBySchoolAndNameStub.resolves([{ _id: localUserId }]);
			findImportUsersBySchoolAndNameStub.resolves([]);

			await userAction.autoMatchImportUser(schoolId, userUpdateObject);
			expect(userUpdateObject.match_userId).to.equal(localUserId);
			expect(userUpdateObject.match_matchedBy).to.equal('auto');
		});

		it('should not create match, when multiple import users with same name exists', async () => {
			const schoolId = 'foo';
			const userUpdateObject = {
				firstName: 'john',
				lastName: 'doe',
			};
			const localUserId = 'bar';
			findUserBySchoolAndNameStub.resolves([{ _id: localUserId }]);
			findImportUsersBySchoolAndNameStub.resolves(['dummyImportUser']);

			await userAction.autoMatchImportUser(schoolId, userUpdateObject);
			expect(userUpdateObject.match_userId).to.be.undefined;
			expect(userUpdateObject.match_matchedBy).to.be.undefined;
		});

		it('should revoke any previously auto-matched import user, when they have the same name', async () => {
			const schoolId = 'foo';
			const userUpdateObject = {
				firstName: 'john',
				lastName: 'doe',
			};
			const localUserId = 'bar';
			findUserBySchoolAndNameStub.resolves([{ _id: localUserId }]);

			const importUsers = [
				{
					systemId: 'dummySystem',
					ldapId: 'dummyLdap',
					match_userId: 'dummyUser',
					match_matchedBy: 'auto',
				},
			];
			findImportUsersBySchoolAndNameStub.resolves(importUsers);

			await userAction.autoMatchImportUser(schoolId, userUpdateObject);

			const importUserNoMatch = {
				systemId: importUsers[0].systemId,
				ldapId: importUsers[0].ldapId,
			};
			expect(
				createOrUpdateImportUserStub.calledWith(
					schoolId,
					importUsers[0].systemId,
					importUsers[0].ldapId,
					importUserNoMatch
				)
			).to.to.true;
		});

		it('should not revoke any previously manually matched import user, when they have the same name', async () => {
			const schoolId = 'foo';
			const userUpdateObject = {
				firstName: 'john',
				lastName: 'doe',
			};
			const localUserId = 'bar';
			findUserBySchoolAndNameStub.resolves([{ _id: localUserId }]);

			const importUsers = [
				{
					systemId: 'dummySystem',
					ldapId: 'dummyLdap',
					match: {
						userId: 'dummyUser',
						matchedBy: 'admin',
					},
				},
			];
			findImportUsersBySchoolAndNameStub.resolves(importUsers);

			await userAction.autoMatchImportUser(schoolId, userUpdateObject);

			expect(createOrUpdateImportUserStub.calledOnce).to.to.false;
		});
	});
});
