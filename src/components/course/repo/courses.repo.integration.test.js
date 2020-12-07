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

const messageForRole = (expectedRole) => {
	(expectedRole === true && '') || 'not';
};

const checkUserRoleInCourse = (result, expectOptions) => {
	expect(result.student).to.be.equal(
		expectOptions.student,
		`should ${messageForRole(expectOptions.student)} be found as student`
	);
	expect(result.teacher).to.be.equal(
		expectOptions.teacher,
		`should ${messageForRole(expectOptions.teacher)} be found as teacher`
	);
	expect(result.substituteTeacher).to.be.equal(
		expectOptions.substituteTeacher,
		`should ${messageForRole(expectOptions.substituteTeacher)} be found as substituteTeacher`
	);
};

describe.only(
	'when having a user in course',
	withApp(() => {
		it('should return courses the user attends', async () => {
			const student = await testObjects.createTestUser({ roles: 'student' });
			const course = await testObjects.createTestCourse({ userIds: [student._id] });
			// TODO create more courses
			const result = await coursesRepo.getCoursesWithUser(student._id);

			expect(result.length, 'one result found only').to.equal(1);
			expect(equal(result[0]._id, course._id), 'result matches created course').to.be.true;
			checkUserRoleInCourse(result[0], { student: true, teacher: false, substituteTeacher: false });
		});

		it('should return courses the user leads (as a primary teacher)', async () => {
			const teacher = await testObjects.createTestUser({ roles: 'teacher' });
			const course = await testObjects.createTestCourse({ teacherIds: [teacher._id] });

			const result = await coursesRepo.getCoursesWithUser(teacher._id);

			expect(result.length, 'one result found only').to.equal(1);
			expect(equal(result[0]._id, course._id), 'result matches created course').to.be.true;
			checkUserRoleInCourse(result[0], { student: false, teacher: true, substituteTeacher: false });
		});

		it('should return courses the user leads (as a substitute teacher)', async () => {
			const substituteTeacher = await testObjects.createTestUser({ roles: 'teacher' });
			const course = await testObjects.createTestCourse({ substitutionIds: [substituteTeacher._id] });

			const result = await coursesRepo.getCoursesWithUser(substituteTeacher._id);

			expect(result.length, 'one result found only').to.equal(1);
			expect(equal(result[0]._id, course._id), 'result matches created course').to.be.true;
			checkUserRoleInCourse(result[0], { student: false, teacher: false, substituteTeacher: true });
		});

		it('should not return courses the user does not belong to', async () => {
			const user = await testObjects.createTestUser({ roles: 'teacher' });
			await testObjects.createTestCourse();

			const result = await coursesRepo.getCoursesWithUser(user._id);

			expect(result.length, 'no result found').to.equal(0);
		});

		it('should return all courses with all roles the user belongs to', async () => {
			const user = await testObjects.createTestUser({ roles: 'teacher' });
			// attend a course
			const studentCourse = await testObjects.createTestCourse({ userIds: [user._id] });
			// lead a course as teacher and substitute teacher
			const teacherCourse = await testObjects.createTestCourse({ substitutionIds: [user._id], teacherIds: [user._id] });

			const result = await coursesRepo.getCoursesWithUser(user._id);
			expect(result.length, 'two results found').to.equal(2);

			// TODO FIX IT
			const resultIds = result.map((res) => res._id);
			expect(resultIds).to.have.members([studentCourse._id, teacherCourse._id], 'expected Course ids missing');

			const resultStudentCourse = result.find((res) => equal(res._id, studentCourse._id));
			checkUserRoleInCourse(resultStudentCourse, { student: true, teacher: false, substituteTeacher: false });
			const resultTeacherCourse = result.find((res) => equal(res._id, teacherCourse._id));
			checkUserRoleInCourse(resultTeacherCourse, { student: false, teacher: true, substituteTeacher: true });
		});

		it('should delete user from course relations - user, teacher, substituteTeacher', async () => {
			const student = await testObjects.createTestUser({ roles: 'student' });
			// create additional user to be user, that the other users are not removed
			const additionalUser = await testObjects.createTestUser({ roles: 'student' });
			await testObjects.createTestCourse({
				userIds: [student._id, additionalUser._id],
				teacherIds: [student._id],
				substitutionIds: [student._id],
			});

			await testObjects.createTestCourse({
				userIds: [student._id],
				teacherIds: [additionalUser._id],
			});

			const result = await coursesRepo.deleteUserFromCourseRelations(student._id);
			expect(result.matchedDocuments, 'two courses should match').to.equal(2);
			expect(result.modifiedDocuments, 'two courses should be modified').to.equal(2);

			// the user has been removed
			const matchesAfter = await coursesRepo.getCoursesWithUser(student._id);
			expect(matchesAfter.length, 'all results have been removed').to.equal(0);

			// additional user is not affeceted
			const matchesAfterAdditionalUser = await coursesRepo.getCoursesWithUser(additionalUser._id);
			expect(matchesAfterAdditionalUser.length, 'other users should not be removed').to.equal(2);
		});
	})
);
