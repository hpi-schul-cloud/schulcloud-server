const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;

const appPromise = require('../../../app');
const coursesRepo = require('./courses.repo');
const { NotFound } = require('../../../errors');
const { equal } = require('../../../helper/compare').ObjectId;
const { withApp, testObjects } = require('../../../../test/utils/withApp.test');

chai.use(chaiAsPromised);
const { expect } = chai;

describe.only(
	'when having a user in course',
	withApp(() => {
		it('should return courses the user attends', async () => {
			const student = await testObjects.createTestUser({ roles: 'student' });
			const course = await testObjects.createTestCourse({ userIds: [student._id] });

			const result = await coursesRepo.getCoursesWithUser(student._id);

			expect(result.length, 'one result found only').to.equal(1);
			expect(equal(result[0]._id, course._id), 'result matches created course').to.be.true;
		});

		it('should return courses the user leads (as a primary teacher)', async () => {
			const teacher = await testObjects.createTestUser({ roles: 'teacher' });
			const course = await testObjects.createTestCourse({ teacherIds: [teacher._id] });
			await testObjects.createTestCourse({ userIds: [teacher._id] });
			const result = await coursesRepo.getCoursesWithUserAsTeacher(teacher._id);

			expect(result.length, 'one result found only').to.equal(1);
			expect(equal(result[0]._id, course._id), 'result matches created course').to.be.true;
		});

		it('should return courses the user leads (as a substitute teacher)', async () => {
			const substituteTeacher = await testObjects.createTestUser({ roles: 'teacher' });
			const course = await testObjects.createTestCourse({ substitutionIds: [substituteTeacher._id] });

			const result = await coursesRepo.getCoursesWithUserAsSubstituteTeacher(substituteTeacher._id);

			expect(result.length, 'one result found only').to.equal(1);
			expect(equal(result[0]._id, course._id), 'result matches created course').to.be.true;
		});

		it.only('should delete user from courses the user attends', async () => {
			const student = await testObjects.createTestUser({ roles: 'student' });
			await testObjects.createTestCourse({ userIds: [student._id] });

			const result = await coursesRepo.deleteUserFromCourseUsers(student._id);
			expect(result.matchedDocuments, 'only one course should match').to.equal(1);
			expect(result.modifiedDocuments, 'only one course should be modified').to.equal(1);

			// the user has been removed
			const matchesAfter = await coursesRepo.getCoursesWithUser(student._id);
			expect(matchesAfter.length, 'all results have been removed').to.equal(0);
		});
	})
);
