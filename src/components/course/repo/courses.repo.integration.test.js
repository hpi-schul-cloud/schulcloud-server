const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const coursesRepo = require('./courses.repo');
const { equal, toString: idToString } = require('../../../helper/compare').ObjectId;
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

describe(
	'when having a course',
	withApp(() => {
		it('should persist all properties given', async () => {
			const testSchool = await testObjects.createTestSchool();
			const testUser = await testObjects.createTestUser({ schoolId: testSchool._id });
			const testTeacher = await testObjects.createTestUser({ schoolId: testSchool._id });
			const testSubstitutionTeacher = await testObjects.createTestUser({ schoolId: testSchool._id });
			const testClass = await testObjects.createTestClass({ schoolId: testSchool._id });
			const testLtiTool = await testObjects.createTestLtiTool();
			const start = Date.now();
			const end = Date.now() + 8600;
			const testCourse = await testObjects.createTestCourse({
				name: 'a course name',
				schoolId: testSchool._id,
				userIds: [testUser._id],
				description: 'a course description',
				classIds: [testClass._id],
				teacherIds: [testTeacher._id],
				substitutionIds: [testSubstitutionTeacher._id],
				ltiToolIds: [testLtiTool],
				features: ['messenger'],
				startDate: start,
				untilDate: end,
			});
			const result = await coursesRepo.getCourseById(testCourse._id);
			expect(equal(result.id, testCourse._id), 'resolves with the created course');
			// userGroup
			expect(result.name, 'name has been persisted').to.be.equal('a course name');
			expect(equal(testSchool._id, result.schoolId), 'schoolId has been persisted').to.be.true;
			expect(result.userIds, 'userId has been added').to.have.members(
				[idToString(testUser._id)],
				'the given user is missing'
			);
			expect(result.description, 'description has been persisted').to.be.equal('a course description');
			// course
			expect(result.teacherIds, 'teacherId has been added').to.have.members(
				[idToString(testTeacher._id)],
				'the given teacher is missing'
			);
			expect(result.substitutionIds, 'substitution teacher id has been added').to.have.members(
				[idToString(testSubstitutionTeacher._id)],
				'the given substitution teacher is missing'
			);
			expect(result.ltiToolIds, 'lti tool id has been added').to.have.members(
				[idToString(testLtiTool._id)],
				'the given lti tool id is missing'
			);
			expect(result.features, 'features have been added').to.have.members(
				['messenger'],
				'messenger is missing in features'
			);
			expect(result.color, 'default color has been applied').to.be.equal('#ACACAC');
			expect(result.startDate, 'startDate has been added').to.be.equal(new Date(start).toISOString());
			expect(result.untilDate, 'untilDate has been added').to.be.equal(new Date(end).toISOString());
		});
	})
);

describe(
	'when having a user in course',
	withApp(() => {
		it('should return courses the user attends', async () => {
			const student = await testObjects.createTestUser({ roles: 'student' });
			const course = await testObjects.createTestCourse({ userIds: [student._id] });
			// other course the user does not belong to
			await testObjects.createTestCourse();
			const result = await coursesRepo.getCoursesWithUser(student._id);

			expect(result.length, 'one result found only').to.equal(1);
			expect(equal(result[0].id, course._id), 'result matches created course').to.be.true;
			checkUserRoleInCourse(result[0], { student: true, teacher: false, substituteTeacher: false });
		});

		it('should return courses the user leads (as a primary teacher)', async () => {
			const teacher = await testObjects.createTestUser({ roles: 'teacher' });
			const course = await testObjects.createTestCourse({ teacherIds: [teacher._id] });

			const result = await coursesRepo.getCoursesWithUser(teacher._id);

			expect(result.length, 'one result found only').to.equal(1);
			expect(equal(result[0].id, course._id), 'result matches created course').to.be.true;
			checkUserRoleInCourse(result[0], { student: false, teacher: true, substituteTeacher: false });
		});

		it('should return courses the user leads (as a substitute teacher)', async () => {
			const substituteTeacher = await testObjects.createTestUser({ roles: 'teacher' });
			const course = await testObjects.createTestCourse({ substitutionIds: [substituteTeacher._id] });

			const result = await coursesRepo.getCoursesWithUser(substituteTeacher._id);

			expect(result.length, 'one result found only').to.equal(1);
			expect(equal(result[0].id, course._id), 'result matches created course').to.be.true;
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
			const teacherCourse = await testObjects.createTestCourse({
				substitutionIds: [user._id],
				teacherIds: [user._id],
			});
			const substitutionTeacherCourse = await testObjects.createTestCourse({
				substitutionIds: [user._id],
			});

			const result = await coursesRepo.getCoursesWithUser(user._id);
			expect(result.length, 'three results found').to.equal(3);

			const resultIds = result.map((res) => res.id);
			expect(resultIds).to.have.members(
				[idToString(studentCourse._id), idToString(teacherCourse._id), idToString(substitutionTeacherCourse._id)],
				'expected Course ids missing'
			);

			const resultStudentCourse = result.find((res) => equal(res.id, studentCourse._id));
			checkUserRoleInCourse(resultStudentCourse, { student: true, teacher: false, substituteTeacher: false });

			const hasSubstitutionTeacher = teacherCourse.substitutionIds.length === 0;
			expect(
				hasSubstitutionTeacher,
				'user might not be added to substitution teachers because it has been added to teachers'
			).to.be.false;
			expect(equal(teacherCourse.teacherIds[0], user._id), 'user is added to teachers').to.be.true;
			const resultTeacherCourse = result.find((res) => equal(res.id, teacherCourse._id));
			checkUserRoleInCourse(resultTeacherCourse, {
				student: false,
				teacher: true,
				substituteTeacher: hasSubstitutionTeacher,
			});

			const resultSubstitutionTeacherCourse = result.find((res) => equal(res.id, substitutionTeacherCourse._id));
			checkUserRoleInCourse(resultSubstitutionTeacherCourse, {
				student: false,
				teacher: false,
				substituteTeacher: true,
			});
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
