const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;

const { BadRequest, NotFound } = require('../../../../../src/errors');
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
		const testSchoolName = 'Test School';
		it('should create class if not exists', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			const schoolId = 1;
			const className = 'Class Name';
			const ldapDn = 'some ldap';
			const currentYear = new ObjectId();
			findSchoolByLdapIdAndSystemStub.returns({ name: testSchoolName, _id: schoolId, currentYear });

			const findClassByYearAndLdapDnStub = sinon.stub(ClassRepo, 'findClassByYearAndLdapDn');
			findClassByYearAndLdapDnStub.returns(null);

			const createClassStub = sinon.stub(ClassRepo, 'createClass');
			await classAction.action({ class: { name: className, ldapDN: ldapDn } });
			expect(createClassStub.calledOnce).to.be.true;

			const { firstArg, lastArg } = createClassStub.firstCall;
			expect(firstArg.name).to.be.equal(className);
			expect(firstArg.ldapDN).to.be.equal(ldapDn);
			expect(lastArg.name).to.be.equal(testSchoolName);
			expect(lastArg.currentYear._id.toString()).to.be.equal(currentYear.toString());
		});

		it('should update class name for existing class', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			const classId = 1;
			findSchoolByLdapIdAndSystemStub.returns({ name: testSchoolName });

			const findClassByYearAndLdapDnStub = sinon.stub(ClassRepo, 'findClassByYearAndLdapDn');
			findClassByYearAndLdapDnStub.returns({ name: 'Test class', _id: classId });

			const updateClassStub = sinon.stub(ClassRepo, 'updateClassName');

			const newClassName = 'New Test Class';
			await classAction.action({ class: { name: newClassName } });
			expect(updateClassStub.calledOnce).to.be.true;
			expect(updateClassStub.getCall(0).firstArg).to.be.equal(classId);
			expect(updateClassStub.getCall(0).lastArg).to.be.equal(newClassName);
		});

		it('should throw an error if class repo throws an error', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			findSchoolByLdapIdAndSystemStub.returns({ name: testSchoolName });

			const findClassByYearAndLdapDnStub = sinon.stub(ClassRepo, 'findClassByYearAndLdapDn');
			findClassByYearAndLdapDnStub.throws(new BadRequest('class repo error'));

			expect(classAction.action({})).to.be.rejectedWith(BadRequest);
		});

		it('should throw an error if school could not be found', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			findSchoolByLdapIdAndSystemStub.returns(null);
			expect(classAction.action({ class: { schoolDn: 'SCHOOL_DN', systemId: '' } })).to.be.rejectedWith(NotFound);
		});
	});
});
