const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;

const { BadRequest, NotFound } = require('../../../../../src/errors');
const { ClassAction } = require('../../../../../src/services/sync/strategies/consumerActions');

const { SchoolRepo, ClassRepo, UserRepo } = require('../../../../../src/services/sync/repo');

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
			const schoolId = new ObjectId();
			const className = 'Class Name';
			const ldapDn = 'some ldap';
			const currentYear = new ObjectId();
			findSchoolByLdapIdAndSystemStub.returns({ name: testSchoolName, _id: schoolId, currentYear });

			const findClassByYearAndLdapDnStub = sinon.stub(ClassRepo, 'findClassByYearAndLdapDn');
			findClassByYearAndLdapDnStub.returns(null);

			const createClassStub = sinon.stub(ClassRepo, 'createClass');
			createClassStub.returns({ _id: new ObjectId() });
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
			const classId = new ObjectId();
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

			await expect(classAction.action({})).to.be.rejectedWith(BadRequest);
		});

		it('should throw an error if school could not be found', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			findSchoolByLdapIdAndSystemStub.returns(null);
			await expect(classAction.action({ class: { schoolDn: 'SCHOOL_DN', systemId: '' } })).to.be.rejectedWith(NotFound);
		});

		describe('When school is in maintenance mode', () => {
			it('should not create class', async () => {
				const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
				findSchoolByLdapIdAndSystemStub.returns({ name: testSchoolName, inMaintenance: true });

				sinon.stub(ClassRepo, 'findClassByYearAndLdapDn').returns(null);

				const createClassSpy = sinon.spy(ClassRepo, 'createClass');

				const newClassName = 'New Test Class';
				await classAction.action({ class: { name: newClassName, ldapDn: 'some ldap' } });

				expect(createClassSpy.notCalled).to.be.true;
			});

			it('should not update class', async () => {
				const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
				findSchoolByLdapIdAndSystemStub.returns({ name: testSchoolName, inMaintenance: true });

				const existingClass = {
					_id: 1,
					name: 'Old Test Class',
					year: new ObjectId(),
					ldapDn: 'Old ldapdn',
				};
				sinon.stub(ClassRepo, 'findClassByYearAndLdapDn').returns(existingClass);

				const updateClassSpy = sinon.spy(ClassRepo, 'updateClassName');

				const newClassName = 'New Test Class';
				await classAction.action({ class: { name: newClassName } });

				expect(updateClassSpy.notCalled).to.be.true;
			});
		});

		describe('When school is in migration mode', () => {
			it('should not create class', async () => {
				const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
				findSchoolByLdapIdAndSystemStub.returns({ name: testSchoolName, inUserMigration: true });

				sinon.stub(ClassRepo, 'findClassByYearAndLdapDn').returns(null);

				const createClassSpy = sinon.spy(ClassRepo, 'createClass');

				const newClassName = 'New Test Class';
				await classAction.action({ class: { name: newClassName, ldapDn: 'some ldap' } });

				expect(createClassSpy.notCalled).to.be.true;
			});

			it('should not update class', async () => {
				const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
				findSchoolByLdapIdAndSystemStub.returns({ name: testSchoolName, inUserMigration: true });

				const existingClass = {
					_id: 1,
					name: 'Old Test Class',
					year: new ObjectId(),
					ldapDn: 'Old ldapdn',
				};
				sinon.stub(ClassRepo, 'findClassByYearAndLdapDn').returns(existingClass);

				const updateClassSpy = sinon.spy(ClassRepo, 'updateClassName');

				const newClassName = 'New Test Class';
				await classAction.action({ class: { name: newClassName } });

				expect(updateClassSpy.notCalled).to.be.true;
			});

			it('should add class to import users', async () => {
				const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');

				const schoolId = 'dummy';
				findSchoolByLdapIdAndSystemStub.returns({ _id: schoolId, name: testSchoolName, inUserMigration: true });

				const addClassToImportUsersStub = sinon.stub(UserRepo, 'addClassToImportUsers');

				const newClassName = 'New Test Class';
				const uniqueMembers = ['foo', 'bar', 'baz'];
				await classAction.action({ class: { name: newClassName, uniqueMembers } });

				expect(addClassToImportUsersStub.calledOnce).to.be.true;
				expect(addClassToImportUsersStub.calledWith(schoolId, newClassName, uniqueMembers)).to.be.true;
			});
		});
	});

	describe('addUsersToClass', () => {
		let updateClassStudentsStub;
		let updateClassTeachersStub;
		const mockClass = {
			_id: new ObjectId(),
		};
		beforeEach(() => {
			const findClassByYearAndLdapDnStub = sinon.stub(ClassRepo, 'findClassByYearAndLdapDn');
			findClassByYearAndLdapDnStub.returns(mockClass);

			updateClassStudentsStub = sinon.stub(ClassRepo, 'updateClassStudents');
			updateClassTeachersStub = sinon.stub(ClassRepo, 'updateClassTeachers');
		});

		afterEach(() => sinon.restore());

		it('should add single user to the class', async () => {
			const uniqueMembers = 'user1';

			const foundUsers = [
				{
					_id: 'user1',
					roles: [{ name: 'student' }],
				},
			];
			const findByLdapDnsAndSchoolStub = sinon.stub(UserRepo, 'findByLdapDnsAndSchool');
			findByLdapDnsAndSchoolStub.returns(foundUsers);

			const schoolObj = { _id: new ObjectId(), currentYear: new ObjectId() };
			await classAction.addUsersToClass(schoolObj._id, mockClass._id, uniqueMembers);

			expect(updateClassStudentsStub.calledOnce).to.be.true;
			expect(updateClassStudentsStub.getCall(0).firstArg.toString()).to.be.equal(mockClass._id.toString());
			expect(updateClassStudentsStub.getCall(0).lastArg).to.eql(['user1']);
		});

		it('should add students and teachers to the class', async () => {
			const uniqueMembers = ['user1', 'user2', 'user3'];

			const foundUsers = [
				{
					_id: 'user1',
					roles: [{ name: 'student' }],
				},
				{
					_id: 'user2',
					roles: [{ name: 'student' }, { name: 'teacher' }], // Should this case exists?
				},
				{
					_id: 'user3',
					roles: [{ name: 'teacher' }],
				},
			];
			const findByLdapDnsAndSchoolStub = sinon.stub(UserRepo, 'findByLdapDnsAndSchool');
			findByLdapDnsAndSchoolStub.returns(foundUsers);

			const schoolObj = { _id: new ObjectId(), currentYear: new ObjectId() };
			await classAction.addUsersToClass(schoolObj._id, mockClass._id, uniqueMembers);

			expect(updateClassStudentsStub.calledOnce).to.be.true;
			expect(updateClassStudentsStub.getCall(0).firstArg.toString()).to.be.equal(mockClass._id.toString());
			expect(updateClassStudentsStub.getCall(0).lastArg).to.eql(['user1', 'user2']);

			expect(updateClassTeachersStub.calledOnce).to.be.true;
			expect(updateClassTeachersStub.getCall(0).firstArg.toString()).to.be.equal(mockClass._id.toString());
			expect(updateClassTeachersStub.getCall(0).lastArg).to.eql(['user2', 'user3']);
		});
	});
});
