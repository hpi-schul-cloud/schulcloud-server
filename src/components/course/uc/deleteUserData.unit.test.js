const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { withApp, testObjects } = require('../../../../test/utils/withApp.test');
const { equal, toString: idToString } = require('../../../helper/compare').ObjectId;
const { deleteUserData } = require('./deleteUserData.uc');
const { ApplicationError } = require('../../../errors');

const { expect } = chai;
chai.use(chaiAsPromised);

const createLessonContents = ({
	user,
	component = 'text',
	title = 'a content title',
	content = {},
	hidden = false,
} = {}) => ({
	user,
	component,
	title,
	content,
	hidden,
});

const simulateOrchestratedDeletion = (userId) => {
	return Promise.all(
		deleteUserData().map((step) => {
			return step(userId);
		})
	);
};

const repeat = (times, promiseFn) => {
	return Promise.all([...Array(times)].map(() => promiseFn()));
};

const createTestUsers = async () => {
	const school = await testObjects.createTestSchool();
	const student = await testObjects.createTestUser({ schoolId: school._id });
	const teacher = await testObjects.createTestUser({ schoolId: school._id });
	const otherUser = await testObjects.createTestUser({ schoolId: school._id });
	const course = await testObjects.createTestCourse({ schoolId: school._id });
	return { otherUser, teacher, student, school, course };
};

// TODO mock the repositoriy calls

describe.only(
	'when removing user data in courses',
	withApp(async () => {
		it('should resolve with empty trashbin data for a user with no course connection', async () => {
			const { student } = await createTestUsers();
			const stepResults = await simulateOrchestratedDeletion(student._id);

			expect(stepResults.length, 'have steps executed').to.be.not.equal(0);
			expect(
				stepResults.every((result) => result.complete === true),
				'all steps are completed'
			).to.be.true;

			expect(
				stepResults.every((result) => result.trashBinData.data.length === 0),
				'all steps have no data added'
			).to.be.true;

			expect(
				stepResults.map((result) => result.trashBinData.scope),
				'have all known steps results given'
			).to.have.members(['courses', 'courseGroups', 'lessons'], 'missing an execution step');
		});

		it('should fail for execution without user id', async () => {
			const deleteUserDataSteps = deleteUserData();
			expect(deleteUserDataSteps.length !== 0, 'have steps').to.be.true;
			deleteUserDataSteps.forEach((step) => {
				expect(step()).to.eventually.throw(ApplicationError);
			});
		});

		it('should add only user related lesson contents to trashbin data', async () => {
			const { otherUser, teacher } = await createTestUsers();

			await testObjects.createTestLesson({
				description: 'a lesson not related to our user',
				contents: [createLessonContents({ user: otherUser._id })],
			});
			const teachersLesson = await testObjects.createTestLesson({
				description: 'a lesson with teachers content',
				contents: [createLessonContents({ user: teacher._id })],
			});

			const stepResults = await simulateOrchestratedDeletion(teacher._id);

			const lessonResults = stepResults.filter((result) => result.trashBinData.scope === 'lessons');
			expect(lessonResults.length, 'have one lesson added').to.be.equal(1);
			const { lessonIds } = lessonResults[0].trashBinData.data;
			expect(lessonIds.length, 'have one result only').to.equal(1);
			expect(equal(lessonIds[0], teachersLesson._id), 'is teachers lesson id').to.be.true;
		});

		it('should add multiple user related lesson contents to trashbin data', async () => {
			const { teacher } = await createTestUsers();

			const teachersLessons = await repeat(2, () =>
				testObjects.createTestLesson({
					description: 'a lesson with teachers content',
					contents: [createLessonContents({ user: teacher._id })],
				})
			);

			const teachersLessonIds = teachersLessons.map((lesson) => idToString(lesson._id));

			const stepResults = await simulateOrchestratedDeletion(teacher._id);

			const lessonResults = stepResults.filter((result) => result.trashBinData.scope === 'lessons');
			expect(lessonResults.length, 'have one lesson added').to.be.equal(1);
			const { lessonIds } = lessonResults[0].trashBinData.data;
			expect(lessonIds.map(idToString), 'have our two lesson ids given').to.have.members(teachersLessonIds);
		});

		it('should add only user related course groups to trashbin data', async () => {
			const { otherUser, teacher, course } = await createTestUsers();

			await testObjects.createTestCourseGroup({
				userIds: [otherUser._id],
				courseId: course._id,
			});
			const teachersCourseGroup = await testObjects.createTestCourseGroup({
				userIds: [teacher._id],
				courseId: course._id,
			});

			const stepResults = await simulateOrchestratedDeletion(teacher._id);

			const courseGroupResults = stepResults.filter((result) => result.trashBinData.scope === 'courseGroups');
			expect(courseGroupResults.length, 'have one course group added').to.be.equal(1);
			const { data } = courseGroupResults[0].trashBinData;
			expect(data.length, 'have one result only').to.equal(1);
			expect(equal(data[0], teachersCourseGroup._id), 'is teachers course group id').to.be.true;
		});

		it('should have added multiple user relations from course groups to trashbin data', async () => {
			const { teacher, course } = await createTestUsers();

			const teachersCourseGroups = await repeat(2, () =>
				testObjects.createTestCourseGroup({
					userIds: [teacher._id],
					courseId: course._id,
				})
			);

			const teachersCourseGroupIds = teachersCourseGroups.map((lesson) => idToString(lesson._id));

			const stepResults = await simulateOrchestratedDeletion(teacher._id);
			const courseGroupResults = stepResults.filter((result) => result.trashBinData.scope === 'courseGroups');
			expect(courseGroupResults.length, 'have one course group item added').to.be.equal(1);
			const { data } = courseGroupResults[0].trashBinData;
			expect(data.length, 'have two results only').to.equal(2);
			expect(data.map(idToString), 'contain all users course groups').to.have.members(
				teachersCourseGroupIds,
				'a user course group is missing'
			);
		});

		it('should have added student user data from courses to trashbin data', async () => {
			const { otherUser, student } = await createTestUsers();
			const course = await testObjects.createTestCourse({ userIds: [student._id, otherUser._id] });
			const courses = await repeat(2, () =>
				testObjects.createTestCourseGroup({
					userIds: [student._id],
					courseId: course._id,
				})
			);

			const studentCourseIds = courses.map((studentCourse) => idToString(studentCourse._id));
			const otherCourse = await testObjects.createTestCourseGroup({
				userIds: [otherUser._id],
				courseId: course._id,
			});
			courses.push(otherCourse);

			const stepResults = await simulateOrchestratedDeletion(student._id);
			const coursesResults = stepResults.filter((result) => result.trashBinData.scope === 'courses');
			expect(coursesResults.length, 'have one courses item added').to.be.equal(1);
			const { courseIds } = coursesResults[0].trashBinData.data;
			expect(courseIds.student).to.be.an('array').of.length(2);
			expect(courseIds.student.map(idToString), 'contain all users course groups').to.have.members(
				studentCourseIds,
				'a user course group is missing'
			);
			expect(courseIds.teacher).to.be.an('array').of.length(0);
			expect(courseIds.substituteTeacher).to.be.an('array').of.length(0);
		});
		it('should have added teacher user data from courses to trashbin data', () => {});
		it('should have added substitution teacher user data from courses to trashbin data', () => {});
	})
);
