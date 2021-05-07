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

			const { firstArg } = createUserAndAccountStub.firstCall;
			const { lastArg } = createUserAndAccountStub.firstCall;

			expect(createUserAndAccountStub.calledOnce).to.be.true;
			expect(firstArg.schoolId).to.be.equal(testSchoolId);
			expect(firstArg._id).to.be.equal(testUserInput._id);
			expect(lastArg._id).to.be.equal(testAccountInput._id);
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
	});
});
