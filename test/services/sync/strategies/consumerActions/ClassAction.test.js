const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;

const { BadRequest } = require('../../../../../src/errors');
const { SyncError } = require('../../../../../src/errors/applicationErrors');
const { ClassAction } = require('../../../../../src/services/sync/strategies/consumerActions');

const { SchoolRepo, ClassRepo } = require('../../../../../src/services/sync/repo');

const { expect } = chai;
chai.use(chaiAsPromised);

describe('Class Actions', () => {
	let classAction;

	before(async () => {
		classAction = new ClassAction(true);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('action: ', () => {
		it('should create class if not exists', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			const schoolId = 1;
			const className = 'Class Name';
			const ldapDn = 'some ldap';
			const currentYear = new ObjectId();
			findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School', _id: schoolId, currentYear });

			const findClassByYearAndLdapDnStub = sinon.stub(ClassRepo, 'findClassByYearAndLdapDn');
			findClassByYearAndLdapDnStub.returns(null);

			const createClassStub = sinon.stub(ClassRepo, 'createClass');
			await classAction.action({ class: { name: className, ldapDN: ldapDn } });
			expect(createClassStub.calledOnce).to.be.true;

			const callArg = createClassStub.firstCall.firstArg;
			expect(callArg.schoolId).to.be.equal(schoolId);
			expect(callArg.name).to.be.equal(className);
			expect(callArg.nameFormat).to.be.equal('static');
			expect(callArg.year).to.be.equal(currentYear);
			expect(callArg.ldapDN).to.be.equal(ldapDn);
		});

		it('should update class name for existing class', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			const classId = 1;
			findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School' });

			const findClassByYearAndLdapDnStub = sinon.stub(ClassRepo, 'findClassByYearAndLdapDn');
			findClassByYearAndLdapDnStub.returns({ name: 'Test class', _id: classId });

			const updateClassStub = sinon.stub(ClassRepo, 'updateClassName');

			const newClassName = 'New Test Class';
			await classAction.action({ class: { name: newClassName } });
			expect(updateClassStub.calledOnce).to.be.true;
			expect(updateClassStub.getCall(0).firstArg).to.be.equal(classId);
			expect(updateClassStub.getCall(0).lastArg).to.be.equal(newClassName);
		});

		it('should throw a sync error if class repo throws an error', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School' });

			const findClassByYearAndLdapDnStub = sinon.stub(ClassRepo, 'findClassByYearAndLdapDn');
			findClassByYearAndLdapDnStub.throws(new BadRequest('class repo error'));

			expect(classAction.action({})).to.eventually.throw(SyncError);
		});
	});
});
