import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import appPromise from '../../../app';
import testObjectsImport from '../../../../test/services/helpers/testObjects'; 
const testObjects = testObjectsImport(appPromise);
import { classesRepo } from '.';
import compareImport from '../../../helper/compare'; 
const { equal: equalIds, toString: idToString } = compareImport.ObjectId;
import { ValidationError } from '../../../errors';

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
			expect(equalIds(classes[0]._id, testClass._id)).to.be.true;
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

			expect(equalIds(classes[0]._id, testClass._id)).to.be.true;
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

			expect(equalIds(classes[0]._id, testClass._id)).to.be.true;
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

			expect(result.nModified).to.be.equal(1);
		});

		it('the class should not contain the student after delete', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const testClass = await testObjects.createTestClass({ userIds: [student._id], schoolId });

			await classesRepo.removeUserFromClasses(student._id);
			const result = await classesRepo.findClassById(testClass._id);

			expect(result.userIds.map(idToString)).to.not.include(idToString(student._id));
		});

		it('the class should not contain the teacher after delete', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const testClass = await testObjects.createTestClass({ teacherIds: [teacher._id], schoolId });

			await classesRepo.removeUserFromClasses(teacher._id);
			const result = await classesRepo.findClassById(testClass._id);

			expect(result.teacherIds.map(idToString)).to.not.include(idToString(teacher._id));
		});

		it('should throw ValidationError if called with no userId', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			await testObjects.createTestClass({ teacherIds: [teacher._id], schoolId });

			expect(classesRepo.removeUserFromClasses()).to.eventually.throw(new ValidationError());
		});

		it('should not modify anything if called for user with no class assigned', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool();
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });

			const result = await classesRepo.removeUserFromClasses(student._id);

			expect(result.nModified).to.be.equal(0);
		});
	});
});
