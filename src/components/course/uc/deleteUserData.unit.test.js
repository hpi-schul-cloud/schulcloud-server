const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { test } = require('mocha');
const { withApp, testObjects } = require('../../../../test/utils/withApp.test');
const { deleteUserData } = require('./deleteUserData.uc');

const { expect } = chai;
chai.use(chaiAsPromised);

const createTestObjects = async () => {
	// create users
	const school = await testObjects.createTestSchool();
	const student = await testObjects.createTestUser({ schoolId: school._id });
	const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id });
	const substitutionTeacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId: school._id });
	const otherUser = await testObjects.createTestUser({ schoolId: school._id });

	// create courses
	const studentCourse = await testObjects.createTestCourse({ userIds: [student._id] });
	const teacherCourse = await testObjects.createTestCourse({ userIds: [teacher._id] });
	const substitutionTeacherCourse = await testObjects.createTestCourse({ userIds: [substitutionTeacher._id] });
	const otherCourse = await testObjects.createTestCourse({ userIds: [otherUser._id] });

	// create courseGroups
	const courseGroup = await testObjects.createTestCourseGroup({ userIds: [teacher._id] });
	const otherCourseGroup = await testObjects.createTestCourseGroup({ userIds: [otherUser._id] });

	// create lessons
	const contents = [
		{
			user: teacher._id,
			component: 'text',
			title: 'a component title',
			content: {},
			hidden: false,
		},
		{
			user: otherUser._id,
			component: 'text',
			title: 'another component title',
			content: {},
			hidden: false,
		},
	];
	const teacherLesson = await testObjects.createTestLesson({ courseId: teacherCourse._id, contents });
	const substitutionTeacherCourseGroup = await testObjects.createTestLesson({ courseId: teacherCourse._id });

	return {
		school,
		student,
		teacher,
		substitutionTeacher,
		studentCourse,
		teacherCourse,
		substitutionTeacherCourse,
		otherCourse,
		courseGroup,
		otherCourseGroup,
		contents,
		teacherLesson,
		substitutionTeacherCourseGroup,
	};
};

describe(
	'when removing user data in courses',
	withApp(async () => {
		it('all steps should resolve with given format', async () => {
			const { teacher } = await createTestObjects();
			const deleteUserDataSteps = deleteUserData();
			expect(deleteUserDataSteps.length, 'have three steps').to.be.equal(3);
			const results = [];
			deleteUserDataSteps.forEach((step) => {
				const data = step(teacher.id);
				expect(typeof data.data).to.be.equal('object');
				expect(typeof data.scope).to.be.equal('string');
				expect(data.completed, 'bulk actions are completed').to.be.true;
				results.push(step);
			});
			expect(results.length, 'all steps have returned data').to.be.equal(deleteUserDataSteps.length);
		});

		it('should have deleted user data from courses', () => {
			// have courses added into trashbin data with user as user, teacher or substitution teacher
			const courseData = resolved.filter((result) => result.scope === 'courses');
			const { courseIds } = courseData.data;
			const studentCourses = courseIds.student;
			expect(studentCourses, '');
			// have no other courses added into trashbin data
		});

		it('should have removed user relations from lesson contents', () => {
			// have lesson ids added into trashbin data
			// have no other lessons in trashbin data
		});

		it('should have removed user relations from course groups', () => {
			// have course group ids added into trashbin data
			// have no other course groups in trashbin data
		});
	})
);
