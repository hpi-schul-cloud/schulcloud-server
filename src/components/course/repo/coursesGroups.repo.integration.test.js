const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);

const courseGroupsRepo = require('./courseGroups.repo');
const { equal, toString: idToString } = require('../../../helper/compare').ObjectId;

chai.use(chaiAsPromised);
const { expect } = chai;

const prepareTestObjects = async () => {
	const testSchool = await testObjects.createTestSchool();
	const testUser = await testObjects.createTestUser({ schoolId: testSchool._id });
	const testCourse = await testObjects.createTestCourse({ schoolId: testSchool._id });
	return { testSchool, testUser, testCourse };
};

describe('when having a user in courseGroup', async () => {
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

		const courseGroup = await courseGroupsRepo.getCourseGroupById(testCourseGroup._id);
		const userIds = courseGroup.userIds.map(idToString);
		expect(userIds, 'testUser id has been removed').not.includes(idToString(testUser._id));
		expect(userIds, 'other user id still exists').includes(idToString(otherUser._id));
	});
});
