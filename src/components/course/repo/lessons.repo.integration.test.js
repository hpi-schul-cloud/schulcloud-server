const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { withApp, testObjects } = require('../../../../test/utils/withApp.test');
const lessonsRepo = require('./lessons.repo');

const { equal } = require('../../../helper/compare').ObjectId;

chai.use(chaiAsPromised);
const { expect } = chai;

const getTestObjects = async () => {
	const courseTeacher = await testObjects.createTestUser({ roles: 'teacher' });
	const course = await testObjects.createTestCourse({ teacherIds: [courseTeacher._id] });
	const contents = [
		{
			user: courseTeacher._id,
			component: 'text',
			title: 'contents title',
			content: { text: 'some text content' },
			hidden: false,
		},
	];
	const lesson = await testObjects.createTestLesson({
		name: 'Demo lesson with user',
		courseId: course._id,
		contents,
	});
	return { courseTeacher, lesson };
};

describe.only(
	'when having a user in lesson contents',
	withApp(() => {
		it('should remove the related lessons', async () => {
			// create test objects
			const { courseTeacher } = await getTestObjects();

			// delete user from lesson contents
			const result = await lessonsRepo.deleteUserFromLessonContents(courseTeacher._id);
			expect(result.matchedDocuments, 'only one lesson should match').to.equal(1);
			expect(result.modifiedDocuments, 'only one lesson should be modified').to.equal(1);

			// the user has been removed
			const matchesAfter = await lessonsRepo.getLessonsWithUserInContens(courseTeacher._id);
			expect(matchesAfter.length, 'all results have been removed').to.equal(0);
		});

		it('should return the related lessons', async () => {
			// create test objects
			const { courseTeacher, lesson } = await getTestObjects();

			// check the filter finds the lesson created
			const matches = await lessonsRepo.getLessonsWithUserInContens(courseTeacher._id);
			expect(matches.length, 'one result found only').to.equal(1);
			expect(equal(matches[0]._id, lesson._id), 'result matches created lesson').to.be.true;
		});
	})
);
