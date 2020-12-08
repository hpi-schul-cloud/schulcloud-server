const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const courseGroupsRepo = require('./courseGroups.repo');
const { equal, toString: idToString } = require('../../../helper/compare').ObjectId;
const { withApp, testObjects } = require('../../../../test/utils/withApp.test');

chai.use(chaiAsPromised);
const { expect } = chai;

const prepareTestObjects = async () => {
	const testSchool = await testObjects.createTestSchool();
	const testUser = await testObjects.createTestUser({ schoolId: testSchool._id });
	const testCourse = await testObjects.createTestCourse({ schoolId: testSchool._id });
	return { testSchool, testUser, testCourse };
};

describe(
	'when creating a courseGroup',
	withApp(() => {
		it('should persist all the given properties', async () => {
			const testSchool = await testObjects.createTestSchool();
			const testUser = await testObjects.createTestUser({ schoolId: testSchool._id });
			const testCourse = await testObjects.createTestCourse({ schoolId: testSchool._id });
			const testCourseGroup = await testObjects.createTestCourseGroup({
				name: 'a course group name',
				schoolId: testSchool._id,
				userIds: [testUser._id],
				courseId: testCourse._id,
			});
			const courseGroup = await courseGroupsRepo.getCourseGroupById(idToString(testCourseGroup._id));

			expect(equal(testCourseGroup._id, courseGroup._id), 'course id is defined properly').to.be.true;
			expect(courseGroup.name, 'name has been set').to.be.equal('a course group name');
			expect(equal(testSchool._id, courseGroup.schoolId), 'schoolId is defined properly').to.be.true;
			expect(equal(testUser._id, courseGroup.userIds[0]), 'some userId is defined properly').to.be.true;
			expect(equal(testCourse._id, courseGroup.courseId), 'courseId is defined properly').to.be.true;
		});
	})
);
describe(
	'when having a user in courseGroup',
	withApp(async () => {
		it('should return course groups including the user', async () => {
			const { testSchool, testUser, testCourse } = await prepareTestObjects();

			const testCourseGroup = await testObjects.createTestCourseGroup({
				name: 'a course group name',
				schoolId: testSchool._id,
				userIds: [testUser._id],
				courseId: testCourse._id,
			});
			const courseGroups = await courseGroupsRepo.getCourseGroupsWithUser(idToString(testUser._id));
			expect(courseGroups.length, 'should resolve with one coursegroup only').to.be.equal(1);
			expect(equal(testCourseGroup._id, courseGroups[0]._id), 'resolves with the created course group').to.be.true;
		});
		it('should not return course groups without the user', async () => {
			const { testSchool, testUser, testCourse } = await prepareTestObjects();

			const testCourseGroup = await testObjects.createTestCourseGroup({
				name: 'a course group name',
				schoolId: testSchool._id,
				userIds: [testUser._id],
				courseId: testCourse._id,
			});
			const otherUser = await testObjects.createTestUser({ schoolId: testSchool._id });
			await testObjects.createTestCourseGroup({
				name: 'another course group name',
				schoolId: testSchool._id,
				userIds: [otherUser._id],
				courseId: testCourse._id,
			});
			const multiUserCourseGroup = await testObjects.createTestCourseGroup({
				name: 'another course group name with user',
				schoolId: testSchool._id,
				userIds: [testUser._id, otherUser._id],
				courseId: testCourse._id,
			});

			const courseGroups = await courseGroupsRepo.getCourseGroupsWithUser(idToString(testUser._id));
			expect(courseGroups.length, 'should resolve with the course groups the user is part of').to.be.equal(2);
			expect(
				courseGroups.map((courseGroup) => idToString(courseGroup._id)),
				'expected user related course group missing'
			).to.have.members([idToString(testCourseGroup._id), idToString(multiUserCourseGroup._id)]);
		});
		it('should remove given user from course groups', async () => {
			const { testSchool, testUser, testCourse } = await prepareTestObjects();
			const otherUser = await testObjects.createTestUser({ schoolId: testSchool._id });

			const testCourseGroup = await testObjects.createTestCourseGroup({
				name: 'a course group name',
				schoolId: testSchool._id,
				userIds: [testUser._id, otherUser._id],
				courseId: testCourse._id,
			});

			const otherTestCourseGroup = await testObjects.createTestCourseGroup({
				name: 'another course group name',
				schoolId: testSchool._id,
				userIds: [otherUser._id],
				courseId: testCourse._id,
			});
			const otherCourseGroup = await courseGroupsRepo.getCourseGroupById(otherTestCourseGroup._id);
			expect(equal(otherCourseGroup._id, otherTestCourseGroup._id), 'second course group exist').to.be.true;

			const result = await courseGroupsRepo.deleteUserFromUserGroups(idToString(testUser._id));
			expect(result.modifiedDocuments, 'one course group has been modified only').to.be.equal(1);
			expect(result.matchedDocuments, 'one course group has been matched only').to.be.equal(1);

			const courseGroup = await courseGroupsRepo.getCourseGroupById(testCourseGroup._id);
			const userIds = courseGroup.userIds.map(idToString);
			expect(userIds, 'testUser id has been removed').not.includes(idToString(testUser._id));
			expect(userIds, 'other user id still exists').includes(idToString(otherUser._id));
		});
	})
);
