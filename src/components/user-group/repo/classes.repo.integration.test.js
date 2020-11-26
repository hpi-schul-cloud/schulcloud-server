const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const { classesRepo } = require('.');
const { classModel } = require('../../../services/user-group/model');
const { GeneralError, BadRequest } = require('../../../errors');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('class repo', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	after(async () => {
		await server.close();
	});

	describe('get classes for student', async () => {
		it('when the function is called with user id, it should return list of classes where the student is part of ', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const testClass = await testObjects.createTestClass({ userIds: [student._id], schoolId });
			const classes = await classesRepo.getClassesForStudent(student._id);

			expect(classes[0]._id).to.deep.equal(testClass._id);
			expect(classes[0].userIds[0]).to.deep.equal(student._id);
		});

		it("when function is called with userId for which classes don't exist, it should return empty array", async () => {
			const student = await testObjects.createTestUser({ roles: ['student'] });
			const classes = await classesRepo.getClassesForStudent(student._id);
			expect(classes.length).to.be.equal(0);
		});
	});

	describe('get classes for teacher', async () => {
		it('when the function is called with teacher id, it should return list of classes where the teacher is part of ', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const testClass = await testObjects.createTestClass({ teacherIds: [teacher._id], schoolId });
			const classes = await classesRepo.getClassesForTeacher(teacher._id);

			expect(classes[0]._id).to.deep.equal(testClass._id);
			expect(classes[0].teacherIds[0]).to.deep.equal(teacher._id);
		});

		it("when function is called with teacherId for which classes don't exist, it should return empty array", async () => {
			const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
			const classes = await classesRepo.getClassesForTeacher(teacher._id);
			expect(classes.length).to.be.equal(0);
		});
	});

	describe('delete student from classes', () => {
		it('when the function is called, it should return list of updated classes', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const testClass = await testObjects.createTestClass({ userIds: [student._id], schoolId });

			const result = await classesRepo.removeStudentFromClasses(student._id, [testClass._id]);

			expect(result.length).to.be.equal(1);
			expect(result[0]).to.be.equal(testClass._id);
		});

		it('when the student is deleted from classes, the class should not contain this student any more', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const testClass = await testObjects.createTestClass({ userIds: [student._id], schoolId });

			await classesRepo.removeStudentFromClasses(student._id, [testClass._id]);
			const result = await classModel
				.find({ userIds: { $in: student._id } })
				.lean()
				.exec();

			result.forEach((c) => {
				expect(c.userIds).to.not.include(student._id);
			});
		});

		it('when the function is called with teacher id, it should return list of updated classes', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const testClass = await testObjects.createTestClass({ userIds: [teacher._id], schoolId });

			const result = await classesRepo.removeTeacherFromClasses(teacher._id, [testClass._id]);

			expect(result.length).to.be.equal(1);
			expect(result[0]).to.be.equal(testClass._id);
		});

		it('when the teacher is deleted from classes, the class should not contain this teacher any more', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const testClass = await testObjects.createTestClass({ userIds: [teacher._id], schoolId });

			await classesRepo.removeTeacherFromClasses(teacher._id, [testClass._id]);
			const result = await classModel
				.find({ userIds: { $in: teacher._id } })
				.lean()
				.exec();

			result.forEach((c) => {
				expect(c.teacherIds).to.not.include(teacher._id);
			});
		});

		it('when the function is called with invalid class id, it throws a general error', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });

			const notExistedId = new ObjectId();
			expect(classesRepo.removeStudentFromClasses(student._id, [notExistedId])).to.eventually.throw(new GeneralError());
		});

		it("when the function is called with valid classes which don't contain the user, it throws a bad request error", async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });

			const notExistedId = new ObjectId();
			expect(classesRepo.removeStudentFromClasses(student._id, [notExistedId])).to.eventually.throw(new BadRequest());
		});
	});
});
