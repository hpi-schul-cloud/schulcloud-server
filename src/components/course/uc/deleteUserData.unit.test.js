const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

const { ObjectId } = require('mongoose').Types;
const { equal, toString: idToString } = require('../../../helper/compare').ObjectId;
const { deleteUserData } = require('./deleteUserData.uc');
const {
	deleteUserDataFromCourses,
	deleteUserDatafromLessons,
	deleteUserDataFromCourseGroups,
} = require('./deleteUserData/deleteUserDataSteps');
const { ApplicationError } = require('../../../errors');
const coursesRepo = require('../repo/courses.repo');
const lessonsRepo = require('../repo/lessons.repo');
const courseGroupsRepo = require('../repo/courseGroups.repo');

const { expect } = chai;
chai.use(chaiAsPromised);

describe('when removing user data from course component receive multiple steps', async () => {
	it('should recieve a function form use case which resolves in an array', () => {
		expect(deleteUserData).to.be.an('array').with.length.greaterThan(0);
		expect(deleteUserData[0]).to.be.an('function');
	});

	describe('test uc internal steps', () => {
		describe('when remove user relations from courses', () => {
			const USER_ID = new ObjectId();
			const USER_ID_WITH_NO_COURSES = new ObjectId();
			const COURSE_ID = new ObjectId();
			const createTestGetCoursesWithUserResult = (
				courseId,
				student = false,
				teacher = false,
				substituteTeacher = false
			) => {
				if (!courseId) {
					return [];
				}

				return [
					{
						_id: courseId,
						student,
						teacher,
						substituteTeacher,
					},
				];
			};
			const initStubs = ({ courseId, isStudent, isTeacher, isSubstituteTeacher }) => {
				const getCoursesStub = sinon.stub(coursesRepo, 'getCoursesWithUser');
				getCoursesStub.callsFake(() => []);
				getCoursesStub
					.withArgs(USER_ID)
					.returns(createTestGetCoursesWithUserResult(courseId, isStudent, isTeacher, isSubstituteTeacher));

				const removeFromCoursesStub = sinon.stub(coursesRepo, 'deleteUserFromCourseRelations');
				removeFromCoursesStub.withArgs(USER_ID).returns({ success: true, modifiedDocuments: 1 });

				return { getCoursesStub, removeFromCoursesStub };
			};
			it('should throw an error for invalid parameters', () => {
				expect(deleteUserDataFromCourses()).to.eventually.throw(ApplicationError);
			});
			it('should resolve with valid trashbin object for user with courses assigned', async () => {
				const { getCoursesStub, removeFromCoursesStub } = initStubs({
					courseId: COURSE_ID,
					isStudent: true,
					isTeacher: true,
					isSubstituteTeacher: true,
				});
				const result = await deleteUserDataFromCourses(USER_ID);
				getCoursesStub.restore();
				removeFromCoursesStub.restore();

				expect(result.complete).to.be.true;
				expect(result.trashBinData.data).to.be.an('object');
				expect(result.trashBinData.scope).to.be.equal('courses');
				const { data } = result.trashBinData;
				expect(data.student.map(idToString), 'have the course id given as student').to.have.members([
					idToString(COURSE_ID),
				]);
				expect(data.teacher.map(idToString), 'have the course id given as teacher').to.have.members([
					idToString(COURSE_ID),
				]);
				expect(
					data.substituteTeacher.map(idToString),
					'have the course id given as substitute teacher'
				).to.have.members([idToString(COURSE_ID)]);
			});
			it('should resolve with empty trashbin object for user without courses assigned', async () => {
				const { getCoursesStub, removeFromCoursesStub } = initStubs({});
				const result = await deleteUserDataFromCourses(USER_ID_WITH_NO_COURSES);
				getCoursesStub.restore();
				removeFromCoursesStub.restore();

				expect(result.complete).to.be.true;
				expect(result.trashBinData.data).to.be.an('object');
				expect(result.trashBinData.scope).to.be.equal('courses');
				expect(result.trashBinData.data).to.deep.equal({});
			});
		});
	});
	describe('when remove data from lesson contents', () => {
		const USER_ID = new ObjectId();
		const USER_ID_WITH_NO_LESSON_CONTENTS = new ObjectId();
		const LESSON_ID = new ObjectId();
		const CONTENT_ID = new ObjectId();
		const createTestGetLessonsWithUserInContensResult = ({ lessonId, contentId, userId }) => {
			if (!lessonId) {
				return [];
			}

			return [
				{
					_id: lessonId,
					contents: [{ _id: contentId, user: userId }],
				},
			];
		};
		const initStubs = ({ lessonId, contentId, userId }) => {
			const getLessonsWithUserInContensStub = sinon.stub(lessonsRepo, 'getLessonsWithUserInContens');
			getLessonsWithUserInContensStub.callsFake(() => []);
			getLessonsWithUserInContensStub
				.withArgs(userId)
				.returns(createTestGetLessonsWithUserInContensResult({ lessonId, contentId, userId }));

			const deleteUserFromLessonContentsStub = sinon.stub(lessonsRepo, 'deleteUserFromLessonContents');
			deleteUserFromLessonContentsStub.withArgs(userId).returns({ success: true, modifiedDocuments: 1 });

			return { getLessonsWithUserInContensStub, deleteUserFromLessonContentsStub };
		};
		it('should throw an error for invalid parameters', () => {
			expect(deleteUserDatafromLessons()).to.eventually.throw(ApplicationError);
		});
		it('should resolve with user data in trashbin object for user with lesson contents assigned', async () => {
			const { getLessonsWithUserInContensStub, deleteUserFromLessonContentsStub } = initStubs({
				lessonId: LESSON_ID,
				contentId: CONTENT_ID,
				userId: USER_ID,
			});
			const result = await deleteUserDatafromLessons(USER_ID);
			getLessonsWithUserInContensStub.restore();
			deleteUserFromLessonContentsStub.restore();

			expect(result.complete).to.be.true;
			expect(result.trashBinData.data).to.be.an('array').of.length(1);
			expect(result.trashBinData.scope).to.be.equal('lessons');
			const { data } = result.trashBinData;
			expect(equal(data[0].lessonId, LESSON_ID)).to.be.true;
			expect(data[0].contentIds).to.be.an('array').of.length(1);
			expect(equal(data[0].contentIds[0], CONTENT_ID)).to.be.true;
		});
		it('should resolve with empty trashbin object for user without lesson contents assigned', async () => {
			const { getLessonsWithUserInContensStub, deleteUserFromLessonContentsStub } = initStubs({});
			const result = await deleteUserDatafromLessons(USER_ID_WITH_NO_LESSON_CONTENTS);
			getLessonsWithUserInContensStub.restore();
			deleteUserFromLessonContentsStub.restore();

			expect(result.complete).to.be.true;
			expect(result.trashBinData.scope).to.be.equal('lessons');
			expect(result.trashBinData.data).to.be.an('array').of.length(0);
		});
	});
	describe('when remove data from course groups', () => {
		const USER_ID = new ObjectId();
		const USER_ID_WITH_NO_COURSE_GROUPS = new ObjectId();
		const COURSE_GROUP_ID = new ObjectId();
		const createTestGetCourseGroupssWithUserResult = (courseGroupId, userId) => {
			if (!courseGroupId) {
				return [];
			}

			return [
				{
					_id: courseGroupId,
					userIds: [userId],
				},
			];
		};
		const initStubs = ({ courseGroupId, userId }) => {
			const getCoursesGroupsStub = sinon.stub(courseGroupsRepo, 'getCourseGroupsWithUser');
			getCoursesGroupsStub.callsFake(() => []);
			getCoursesGroupsStub.withArgs(userId).returns(createTestGetCourseGroupssWithUserResult(courseGroupId, userId));

			const deleteUserFromUserGroupsStub = sinon.stub(courseGroupsRepo, 'deleteUserFromUserGroups');
			deleteUserFromUserGroupsStub.withArgs(userId).returns({ success: true, modifiedDocuments: 1 });

			return { getCoursesGroupsStub, deleteUserFromUserGroupsStub };
		};
		it('should throw an error for invalid parameters', () => {
			expect(deleteUserDataFromCourseGroups()).to.eventually.throw(ApplicationError);
		});
		it('should resolve with user data in trashbin object for user with course groups assigned', async () => {
			const { getCoursesGroupsStub, deleteUserFromUserGroupsStub } = initStubs({
				courseGroupId: COURSE_GROUP_ID,
				userId: USER_ID,
			});
			const result = await deleteUserDataFromCourseGroups(USER_ID);
			getCoursesGroupsStub.restore();
			deleteUserFromUserGroupsStub.restore();

			expect(result.complete).to.be.true;
			expect(result.trashBinData.data).to.be.an('array').of.length(1);
			expect(result.trashBinData.scope).to.be.equal('courseGroups');
			const { data } = result.trashBinData;
			expect(data).to.be.an('array').of.length(1);
			expect(equal(data[0], COURSE_GROUP_ID)).to.be.true;
		});
		it('should resolve with empty trashbin object for user without course groups assigned', async () => {
			const { getCoursesGroupsStub, deleteUserFromUserGroupsStub } = initStubs({});
			const result = await deleteUserDataFromCourseGroups(USER_ID_WITH_NO_COURSE_GROUPS);
			getCoursesGroupsStub.restore();
			deleteUserFromUserGroupsStub.restore();

			expect(result.complete).to.be.true;
			expect(result.trashBinData.scope).to.be.equal('courseGroups');
			expect(result.trashBinData.data).to.be.an('array').of.length(0);
		});
	});
});
