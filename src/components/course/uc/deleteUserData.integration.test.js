const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);

const { createLessonContents } = testObjects.lessons;
const { equal, toString: idToString } = require('../../../helper/compare').ObjectId;
const { deleteUserData } = require('./deleteUserData.uc');
const { ValidationError } = require('../../../errors');

const { expect } = chai;
chai.use(chaiAsPromised);

const simulateOrchestratedDeletion = (userId) => Promise.all(deleteUserData().map((step) => step(userId)));

const repeat = (times, promiseFn) => Promise.all([...Array(times)].map(() => promiseFn()));

const createTestData = async () => {
	const school = await testObjects.createTestSchool();
	const student = await testObjects.createTestUser({ schoolId: school._id });
	const teacher = await testObjects.createTestUser({ schoolId: school._id });
	const substituteTeacher = await testObjects.createTestUser({ schoolId: school._id });
	const otherUser = await testObjects.createTestUser({ schoolId: school._id });
	const course = await testObjects.createTestCourse({ schoolId: school._id });
	return { otherUser, teacher, substituteTeacher, student, school, course };
};

describe('when removing user data in courses', async () => {
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

	it('should resolve with empty trashbin data for a user with no course connection', async () => {
		const { student } = await createTestData();
		const stepResults = await simulateOrchestratedDeletion(student._id);

		expect(stepResults.length, 'have steps executed').to.be.not.equal(0);
		expect(
			stepResults.every((result) => result.complete === true),
			'all steps are completed'
		).to.be.true;

		expect(
			stepResults.every((result) => result.trashBinData.data !== undefined),
			'all steps have data defined'
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
			expect(step()).to.eventually.throw(ValidationError);
		});
	});

	it('should add only user related lesson contents to trashbin data', async () => {
		const { otherUser, teacher } = await createTestData();

		await testObjects.createTestLesson({
			description: 'a lesson not related to our user',
			contents: [createLessonContents({ user: otherUser._id })],
		});
		const teachersLesson = await testObjects.createTestLesson({
			description: 'a lesson with teachers content',
			contents: [createLessonContents({ user: teacher._id }), createLessonContents({ user: otherUser._id })],
		});
		const teachersContent = teachersLesson
			.toObject()
			.contents.filter((content) => equal(content.user, teacher._id))
			.map((content) => content._id);
		expect(teachersContent).to.be.an('array').of.length(1);
		const stepResults = await simulateOrchestratedDeletion(teacher._id);

		const lessonResults = stepResults.filter((result) => result.trashBinData.scope === 'lessons');
		expect(lessonResults.length, 'have one lesson added').to.be.equal(1);
		const lessonIds = lessonResults[0].trashBinData.data;
		expect(lessonIds.length, 'have one result only').to.equal(1);
		expect(equal(lessonIds[0].lessonId, teachersLesson._id), 'is teachers lesson id').to.be.true;
		const { contentIds } = lessonIds[0];
		expect(contentIds).to.be.an('array').of.length(1);
		expect(contentIds[0]).to.deep.equal(teachersContent[0]);
	});

	it('should add multiple user related lesson contents to trashbin data', async () => {
		const { teacher } = await createTestData();

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
		const lessonIds = lessonResults[0].trashBinData.data;
		expect(
			lessonIds.map((lesson) => idToString(lesson.lessonId)),
			'have our two lesson ids given'
		).to.have.members(teachersLessonIds);
	});

	it('should add only user related course groups to trashbin data', async () => {
		const { otherUser, teacher, course } = await createTestData();

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
		const { teacher, course } = await createTestData();

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

	describe('when removing user relations from courses', () => {
		const haveUserCoursesInTrashBin = async (userId, type, userCourseIds) => {
			const stepResults = await simulateOrchestratedDeletion(userId);
			const coursesResults = stepResults.filter((result) => result.trashBinData.scope === 'courses');
			expect(coursesResults, 'have one courses item added').to.be.an('array').of.length(1);
			const courseIds = coursesResults[0].trashBinData.data;
			expect(courseIds[type]).to.be.an('array').of.length(userCourseIds.length);
			expect(courseIds[type].map(idToString), 'contain all users course groups').to.have.members(
				userCourseIds,
				'a user course group is missing'
			);
		};

		it('should have added user data from courses to trashbin data', async () => {
			const { student, teacher, substituteTeacher } = await createTestData();
			const studentCourses = await repeat(2, () =>
				testObjects.createTestCourse({
					userIds: [student._id],
				})
			);
			const studentCourseIds = studentCourses.map((course) => idToString(course._id));
			const teacherCourses = await repeat(2, () =>
				testObjects.createTestCourse({
					teacherIds: [teacher._id],
				})
			);
			const teacherCourseIds = teacherCourses.map((course) => idToString(course._id));
			const substituteTeacherCourses = await repeat(2, () =>
				testObjects.createTestCourse({
					substitutionIds: [substituteTeacher._id],
				})
			);
			const substituteTeacherCourseIds = substituteTeacherCourses.map((course) => idToString(course._id));

			await haveUserCoursesInTrashBin(student._id, 'student', studentCourseIds);
			await haveUserCoursesInTrashBin(teacher._id, 'teacher', teacherCourseIds);
			await haveUserCoursesInTrashBin(substituteTeacher._id, 'substituteTeacher', substituteTeacherCourseIds);
		});
	});
});
