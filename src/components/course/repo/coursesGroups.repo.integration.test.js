const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const courseGroupsRepo = require('./courseGroups.repo');
const { equal, toString } = require('../../../helper/compare').ObjectId;
const { withApp, testObjects } = require('../../../../test/utils/withApp.test');

chai.use(chaiAsPromised);
const { expect } = chai;

describe.only(
	'when creating a courseGroup',
	withApp(() => {
		it('should keep all the given properties', async () => {
			const testSchool = await testObjects.createTestSchool();
			const testUser = await testObjects.createTestUser({ schoolId: testSchool._id });
			const testCourse = await testObjects.createTestCourse({ schoolId: testSchool._id });
			const testCourseGroup = await testObjects.createTestCourseGroup({
				name: 'a course group name',
				schoolId: testSchool._id,
				userIds: [testUser._id],
				courseId: testCourse._id,
			});
			const courseGroup = await courseGroupsRepo.getCourseGroupById(toString(testCourseGroup._id));

			expect(equal(testCourseGroup._id, courseGroup.id), 'course id is defined properly').to.be.true;
			expect(typeof courseGroup.id).to.be.equal('string');
			expect(courseGroup.name, 'name has been set').to.be.equal('a course group name');
			expect(equal(testSchool._id, courseGroup.schoolId), 'schoolId is defined properly').to.be.true;
			expect(typeof courseGroup.schoolId).to.be.equal('string');
			expect(equal(testUser._id, courseGroup.userIds[0]), 'some userId is defined properly').to.be.true;
			expect(courseGroup.userIds.map((id) => typeof id)).to.all.includes('string');
			expect(equal(testCourse._id, courseGroup.courseId), 'courseId is defined properly').to.be.true;
			expect(typeof courseGroup.courseId).to.be.equal('string');
		});
	})
);
