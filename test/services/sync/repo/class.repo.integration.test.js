const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;

const ClassRepo = require('../../../../src/services/sync/repo/class.repo');
const { classModel } = require('../../../../src/services/user-group/model');

const appPromise = require('../../../../src/app');

const testObjects = require('../../helpers/testObjects')(appPromise);

chai.use(chaiAsPromised);
const { expect } = chai;

describe('class repo', () => {
	let app;
	let server;
	const createdClasses = [];

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	beforeEach(async () => {});

	afterEach(async () => {
		const classPromises = createdClasses.map((clazz) => classModel.remove(clazz));
		await Promise.all(classPromises);
		await testObjects.cleanup();
	});

	after(async () => {
		await server.close();
	});

	describe('createClass', () => {
		it('should successfully create new class', async () => {
			const className = 'Test Class';
			const school = await testObjects.createTestSchool();
			const res = await ClassRepo.createClass({ name: className, schoolId: school._id }, school);
			expect(res._id).to.be.not.undefined;
			expect(res.name).to.be.equal(className);

			createdClasses.push(res);
		});
	});
	describe('updateClassName', () => {
		it('should successfully update class name', async () => {
			const className = 'New Test Class';
			const clazz = await testObjects.createTestClass({});
			const res = await ClassRepo.updateClassName(clazz._id, className);
			expect(res.name).to.be.equal(className);
		});
	});

	describe('findClassByYearAndLdapDn', () => {
		it('should return null if not found', async () => {
			const res = await ClassRepo.findClassByYearAndLdapDn(undefined, 'Not existed dn');
			expect(res).to.be.null;
		});

		it('should find class by ldap and system', async () => {
			const ldapDN = new ObjectId();
			const school = await testObjects.createTestSchool();
			const year = new ObjectId();
			const clazz = await testObjects.createTestClass({ ldapDN, schoolId: school._id, year });
			const res = await ClassRepo.findClassByYearAndLdapDn(year, ldapDN);
			expect(res._id.toString()).to.be.equal(clazz._id.toString());
		});
	});

	describe('updateClassStudents', () => {
		it('should update class students', async () => {
			const existedStudentIds = [new ObjectId(), new ObjectId()];
			const clazz = await testObjects.createTestClass({ userIds: existedStudentIds });
			expect(clazz.userIds).eql(existedStudentIds);

			const studentIds = [new ObjectId(), new ObjectId()];
			await ClassRepo.updateClassStudents(clazz._id, studentIds);

			const foundClass = await classModel.findById(clazz._id);
			expect(foundClass.userIds).eql(studentIds);
		});
	});

	describe('updateClassTeachers', () => {
		it('should update class teachers', async () => {
			const existedTeacherIds = [new ObjectId(), new ObjectId()];
			const clazz = await testObjects.createTestClass({ teacherIds: existedTeacherIds });
			expect(clazz.teacherIds).eql(existedTeacherIds);

			const teacherIds = [new ObjectId(), new ObjectId()];
			await ClassRepo.updateClassTeachers(clazz._id, teacherIds);

			const foundClass = await classModel.findById(clazz._id);
			expect(foundClass.teacherIds).eql(teacherIds);
		});
	});
});
