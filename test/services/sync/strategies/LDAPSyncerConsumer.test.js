const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;

const { LDAP_SYNC_ACTIONS } = require('../../../../src/services/sync/strategies/LDAPSyncer');
const { LDAPSyncerConsumer } = require('../../../../src/services/sync/strategies/LDAPSyncerConsumer');
const { BadRequest } = require('../../../../src/errors');
const { SyncError } = require('../../../../src/errors/applicationErrors');

const { SchoolRepo, ClassRepo, UserRepo } = require('../../../../src/services/sync/repo');

const appPromise = require('../../../../src/app');

const { expect } = chai;
chai.use(chaiAsPromised);

describe('Ldap Syncer Consumer', () => {
	let app;
	let sandbox;

	before(async () => {
		app = await appPromise;
	});

	beforeEach(() => {
		sandbox = sinon.createSandbox();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('execute message: ', () => {
		let ldapConsumer;

		before(() => {
			ldapConsumer = new LDAPSyncerConsumer();
		});

		it('should execute sync school action', async () => {
			const schoolActionStub = sandbox.stub(ldapConsumer, 'schoolAction');
			const content = { action: LDAP_SYNC_ACTIONS.SYNC_SCHOOL, syncId: 'someId', data: {} };
			const message = { content: JSON.stringify(content) };
			await ldapConsumer.executeMessage(message);
			expect(schoolActionStub.calledOnce).to.be.true;
		});

		it('should execute sync user action', async () => {
			const userActionStub = sandbox.stub(ldapConsumer, 'userAction');
			const content = { action: LDAP_SYNC_ACTIONS.SYNC_USER, syncId: 'someId', data: {} };
			const message = { content: JSON.stringify(content) };
			await ldapConsumer.executeMessage(message);
			expect(userActionStub.calledOnce).to.be.true;
		});

		it('should execute sync classes action', async () => {
			const classActionStub = sandbox.stub(ldapConsumer, 'classAction');
			const content = { action: LDAP_SYNC_ACTIONS.SYNC_CLASSES, syncId: 'someId', data: {} };
			const message = { content: JSON.stringify(content) };
			await ldapConsumer.executeMessage(message);
			expect(classActionStub.calledOnce).to.be.true;
		});

		it('should throw a BadRequest for unknown action', async () => {
			const content = { action: 'UNKNOWN', syncId: 'someId', data: {} };
			const message = { content: JSON.stringify(content) };
			expect(ldapConsumer.executeMessage(message)).to.eventually.throw(BadRequest);
		});
	});

	describe('schoolAction: ', () => {
		it('create school if not exists', async () => {
			const findSchoolByLdapIdAndSystemStub = sandbox.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			findSchoolByLdapIdAndSystemStub.returns(null);

			const createSchoolStub = sandbox.stub(SchoolRepo, 'createSchool');

			const ldapConsumer = new LDAPSyncerConsumer();
			await ldapConsumer.schoolAction({ name: 'Test School' });
			expect(createSchoolStub.calledOnce).to.be.true;
		});

		it('update school name for existing school', async () => {
			const findSchoolByLdapIdAndSystemStub = sandbox.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			const schoolId = 1;
			findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School', _id: schoolId });

			const updateSchoolStub = sandbox.stub(SchoolRepo, 'updateSchoolName');

			const ldapConsumer = new LDAPSyncerConsumer();
			const newSchoolName = 'New Test School';
			await ldapConsumer.schoolAction({ name: newSchoolName });
			expect(updateSchoolStub.calledOnce).to.be.true;
			expect(updateSchoolStub.getCall(0).firstArg).to.be.equal(schoolId);
			expect(updateSchoolStub.getCall(0).lastArg).to.be.equal(newSchoolName);
		});

		it('should throw a sync error if school repo throws an error', async () => {
			const findSchoolByLdapIdAndSystemStub = sandbox.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			findSchoolByLdapIdAndSystemStub.throws(new BadRequest('school repo error'));
			const ldapConsumer = new LDAPSyncerConsumer();
			expect(ldapConsumer.schoolAction({})).to.eventually.throw(SyncError);
		});
	});

	describe('Class action: ', () => {
		it('should create class if not exists', async () => {
			const findSchoolByLdapIdAndSystemStub = sandbox.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			const schoolId = 1;
			const className = 'Class Name';
			const ldapDn = 'some ldap';
			const currentYear = new ObjectId();
			findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School', _id: schoolId, currentYear });

			const findClassByYearAndLdapDnStub = sandbox.stub(ClassRepo, 'findClassByYearAndLdapDn');
			findClassByYearAndLdapDnStub.returns(null);

			const createClassStub = sandbox.stub(ClassRepo, 'createClass');
			const ldapConsumer = new LDAPSyncerConsumer();
			await ldapConsumer.classAction({ name: className, ldapDN: ldapDn });
			expect(createClassStub.calledOnce).to.be.true;

			const callArg = createClassStub.firstCall.firstArg;
			expect(callArg.schoolId).to.be.equal(schoolId);
			expect(callArg.name).to.be.equal(className);
			expect(callArg.nameFormat).to.be.equal('static');
			expect(callArg.year).to.be.equal(currentYear);
			expect(callArg.ldapDN).to.be.equal(ldapDn);
		});

		it('should update class name for existing class', async () => {
			const findSchoolByLdapIdAndSystemStub = sandbox.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			const classId = 1;
			findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School' });

			const findClassByYearAndLdapDnStub = sandbox.stub(ClassRepo, 'findClassByYearAndLdapDn');
			findClassByYearAndLdapDnStub.returns({ name: 'Test class', _id: classId });

			const updateClassStub = sandbox.stub(ClassRepo, 'updateClassName');

			const ldapConsumer = new LDAPSyncerConsumer();
			const newClassName = 'New Test Class';
			await ldapConsumer.classAction({ name: newClassName });
			expect(updateClassStub.calledOnce).to.be.true;
			expect(updateClassStub.getCall(0).firstArg).to.be.equal(classId);
			expect(updateClassStub.getCall(0).lastArg).to.be.equal(newClassName);
		});

		it('should throw a sync error if class repo throws an error', async () => {
			const findSchoolByLdapIdAndSystemStub = sandbox.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School' });

			const findClassByYearAndLdapDnStub = sandbox.stub(ClassRepo, 'findClassByYearAndLdapDn');
			findClassByYearAndLdapDnStub.throws(new BadRequest('class repo error'));

			const ldapConsumer = new LDAPSyncerConsumer();
			expect(ldapConsumer.classAction({})).to.eventually.throw(SyncError);
		});
	});

	describe('User action: ', () => {
		it('should create user and account if not exists', async () => {
			const findSchoolByLdapIdAndSystemStub = sandbox.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			const testSchoolId = new ObjectId();
			findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School', _id: testSchoolId });

			const findByLdapIdAndSchoolStub = sandbox.stub(UserRepo, 'findByLdapIdAndSchool');
			findByLdapIdAndSchoolStub.returns(null);

			const createUserAndAccountStub = sandbox.stub(UserRepo, 'createUserAndAccount');

			const ldapConsumer = new LDAPSyncerConsumer();
			const testUserInput = { _id: 1 };
			const testAccountInput = { _id: 2 };
			await ldapConsumer.userAction({ user: testUserInput, account: testAccountInput });

			const { firstArg } = createUserAndAccountStub.firstCall;
			const { lastArg } = createUserAndAccountStub.firstCall;

			expect(createUserAndAccountStub.calledOnce).to.be.true;
			expect(firstArg.schoolId).to.be.equal(testSchoolId);
			expect(firstArg._id).to.be.equal(testUserInput._id);
			expect(lastArg._id).to.be.equal(testAccountInput._id);
		});

		it('should update user and account if exists', async () => {
			const findSchoolByLdapIdAndSystemStub = sandbox.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			const testSchoolId = new ObjectId();
			findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School', _id: testSchoolId });

			const findByLdapIdAndSchoolStub = sandbox.stub(UserRepo, 'findByLdapIdAndSchool');
			const existingUser = {
				_id: 1,
				firstName: 'Old fname',
				lastName: 'Old lname',
				email: 'Old email',
				ldapDn: 'Old ldapdn',
			};
			findByLdapIdAndSchoolStub.returns(existingUser);

			const updateUserAndAccountStub = sandbox.stub(UserRepo, 'updateUserAndAccount');

			const ldapConsumer = new LDAPSyncerConsumer();
			const testUserInput = {
				_id: 1,
				firstName: 'New fname',
				lastName: 'New lname',
				email: 'New email',
				ldapDn: 'new ldapdn',
				roles: [new ObjectId()],
			};
			const testAccountInput = { _id: 2 };
			await ldapConsumer.userAction({ user: testUserInput, account: testAccountInput });

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
			const findSchoolByLdapIdAndSystemStub = sandbox.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School' });

			const findByLdapIdAndSchoolStub = sandbox.stub(UserRepo, 'findByLdapIdAndSchool');
			findByLdapIdAndSchoolStub.throws(new BadRequest('class repo error'));

			const ldapConsumer = new LDAPSyncerConsumer();
			await ldapConsumer.userAction({});
			expect(ldapConsumer.userAction({})).to.eventually.throw(SyncError);
		});
	});
});
