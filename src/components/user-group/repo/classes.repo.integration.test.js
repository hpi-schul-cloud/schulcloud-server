const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const { classesRepo } = require('.');

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

	describe('when get classes for user', async () => {
		it('should return list of classes where the user is part of ', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const user = await testObjects.createTestUser({ roles: ['student', 'teacher'], schoolId });
			const testClass = await testObjects.createTestClass({ userIds: [user._id], teacherIds: [user._id], schoolId });
			const classes = await classesRepo.getClassesForUser(user._id);

			expect(classes.length, 'only one class expected').to.be.equal(1);
			expect(classes[0]._id).to.deep.equal(testClass._id);
			expect(classes[0].student, 'Student role expected').to.be.true;
			expect(classes[0].teacher, 'Teacher role expected').to.be.true;
		});

		it('should return empty array for user with no class assigned', async () => {
			const student = await testObjects.createTestUser({ roles: ['student'] });
			const classes = await classesRepo.getClassesForUser(student._id);
			expect(classes.length).to.be.equal(0);
		});
	});

	describe('when find classes for teacher', async () => {
		it('should return list of classes where the teacher is part of ', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const testClass = await testObjects.createTestClass({ teacherIds: [teacher._id], schoolId });

			const classes = await classesRepo.findClassesByTeacher(teacher._id);

			expect(classes[0]._id).to.deep.equal(testClass._id);
			expect(classes[0].teacherIds[0]).to.deep.equal(teacher._id);
		});

		it('should return empty array for user with no class assigned (as teacher)', async () => {
			const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
			const classes = await classesRepo.findClassesByTeacher(teacher._id);
			expect(classes.length).to.be.equal(0);
		});
	});

	describe('when find classes for student', async () => {
		it('should return list of classes where the student is part of ', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const testClass = await testObjects.createTestClass({ userIds: [student._id], schoolId });

			const classes = await classesRepo.findClassesByStudent(student._id);

			expect(classes[0]._id).to.deep.equal(testClass._id);
			expect(classes[0].userIds[0]).to.deep.equal(student._id);
		});

		it('should return empty array for user with no class assigned (as student)', async () => {
			const student = await testObjects.createTestUser({ roles: ['student'] });
			const classes = await classesRepo.findClassesByStudent(student._id);
			expect(classes.length).to.be.equal(0);
		});
	});

	describe('delete user from classes', () => {
		it('should return list of updated classes', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			await testObjects.createTestClass({ userIds: [student._id], schoolId });

			const result = await classesRepo.removeUserFromClasses(student._id);

			expect(result.n).to.be.equal(1);
			expect(result.nModified).to.be.equal(1);
		});

		it('the class should not contain the student after delete', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const testClass = await testObjects.createTestClass({ userIds: [student._id], schoolId });

			await classesRepo.removeUserFromClasses(student._id);
			const result = await classesRepo.findClassById(testClass._id);

			expect(result.userIds).to.not.include(student._id);
		});

		it('the class should not contain the teacher after delete', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const testClass = await testObjects.createTestClass({ teacherIds: [teacher._id], schoolId });

			await classesRepo.removeUserFromClasses(teacher._id);
			const result = await classesRepo.findClassById(testClass._id);

			expect(result.teacherIds).to.not.include(teacher._id);
		});

		it("when the function is called with valid classes which don't contain the user, it throws a bad request error", async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });

			const result = await classesRepo.removeUserFromClasses(student._id);

			expect(result.n).to.be.equal(0);
			expect(result.nModified).to.be.equal(0);
		});
	});
});
