const chai = require('chai');

const testObjects = require('../../../../test/services/helpers/testObjects');
const { SubmissionModel, HomeworkModel } = require('../db');
const {
	findPrivateHomeworksFromUser,
	deletePrivateHomeworksFromUser,
	findPublicHomeworksFromUser,
	replaceUserInHomeworks,
} = require('./task.repo');
const appPromise = require('../../../app');

const { expect } = chai;

const createHomeworks = async (testHelper) => {
	const userId = testHelper.generateObjectId();
	const otherUserId = testHelper.generateObjectId();
	const lessonId = testHelper.generateObjectId();
	const courseId = testHelper.generateObjectId();

	const promPrivate = testHelper.createTestHomework({ teacherId: userId, private: true });
	const promPrivateLesson = testHelper.createTestHomework({ teacherId: userId, private: true, lessonId });
	const promPrivateCourse = testHelper.createTestHomework({ teacherId: userId, private: true, courseId });

	const promPublic = testHelper.createTestHomework({ teacherId: userId, private: false });
	const promPublicLesson = testHelper.createTestHomework({ teacherId: userId, private: false, lessonId });
	const promPublicCourse = testHelper.createTestHomework({ teacherId: userId, private: false, courseId });

	const promOtherPrivate = testHelper.createTestHomework({ teacherId: otherUserId, private: true });
	const promOtherPrivateLesson = testHelper.createTestHomework({ teacherId: otherUserId, private: true, lessonId });
	const promOtherPrivateCourse = testHelper.createTestHomework({ teacherId: otherUserId, private: true, courseId });

	const [
		privateH,
		privateLessonH,
		privateCourseH,
		publicH,
		publicLessonH,
		publicCourseH,
		otherPrivateH,
		otherPrivateLessonH,
		otherPrivateCourseH,
	] = await Promise.all([
		promPrivate,
		promPrivateLesson,
		promPrivateCourse,
		promPublic,
		promPublicLesson,
		promPublicCourse,
		promOtherPrivate,
		promOtherPrivateLesson,
		promOtherPrivateCourse,
	]);

	return {
		userId,
		otherUserId,
		privateH,
		privateLessonH,
		privateCourseH,
		publicH,
		publicLessonH,
		publicCourseH,
		otherPrivateH,
		otherPrivateLessonH,
		otherPrivateCourseH,
	};
};

const matchId = (ressource) => ({ _id }) => _id.toString() === ressource._id.toString();
const findHomeworks = (userId) => HomeworkModel.find({ teacherId: userId }).lean().exec();

describe.only('task.repo', () => {
	let app;
	let server;
	let testHelper;

	before(async () => {
		app = await appPromise;
		testHelper = testObjects(app);
		server = await app.listen(0);
	});

	afterEach(async () => {
		await testHelper.cleanup();
	});

	after(async () => {
		await server.close();
	});

	describe('findPrivateHomeworksFromUser', () => {
		it('should find private homeworks from a user in all contexts', async () => {
			const { userId, privateH, privateLessonH, privateCourseH } = await createHomeworks(testHelper);

			const result = await findPrivateHomeworksFromUser(userId);

			expect(result).to.be.an('array').with.lengthOf(3);
			expect(result.some(matchId(privateH)), 'find private not added homework').to.be.true;
			expect(result.some(matchId(privateLessonH)), 'find private lesson homework').to.be.true;
			expect(result.some(matchId(privateCourseH)), 'find private course homework').to.be.true;
		});

		it('should work with select as second parameter', async () => {
			const userId = testHelper.generateObjectId();

			const homework = await testHelper.createTestHomework({ teacherId: userId, private: true });

			const selectedKeys = ['_id', 'name'];
			const result = await findPrivateHomeworksFromUser(userId, selectedKeys);
			expect(result).to.be.an('array').with.lengthOf(1);
			expect(result[0]).to.have.all.keys(selectedKeys);
			expect(result[0]._id.toString()).to.equal(homework._id.toString());
			expect(result[0].name).to.equal(homework.name);
		});

		it('should handle no private homeworks exist without errors', async () => {
			const userId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: userId });
			const result = await findPrivateHomeworksFromUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: otherUserId });
			const result = await findPrivateHomeworksFromUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle unexpected inputs', async () => {
			const userId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: userId });

			// must execute step by step that errors not mixed
			const resultNull = await findPrivateHomeworksFromUser(null);
			expect(resultNull, 'when input is null').to.be.an('array').with.lengthOf(0);

			const resultUndefined = await findPrivateHomeworksFromUser(undefined);
			expect(resultUndefined, 'when input is undefined').to.be.an('array').with.lengthOf(0);

			try {
				await findPrivateHomeworksFromUser('123');
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "123" at path "teacherId" for model "homework"'
				);
			}

			try {
				await findPrivateHomeworksFromUser(() => {});
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "[Function (anonymous)]" at path "teacherId" for model "homework"'
				);
			}
		});
	});

	describe('findPublicHomeworksFromUser', () => {
		it('should find public homeworks from a user in all contexts', async () => {
			const { userId, publicH, publicLessonH, publicCourseH } = await createHomeworks(testHelper);

			const result = await findPublicHomeworksFromUser(userId);

			expect(result).to.be.an('array').with.lengthOf(3);
			// from DB and model is public homework without lesson and course possible, it is only force by client controller
			expect(result.some(matchId(publicH)), 'find public not added homework').to.be.true;
			expect(result.some(matchId(publicLessonH)), 'find public lesson homework').to.be.true;
			expect(result.some(matchId(publicCourseH)), 'find public course homework').to.be.true;
		});

		it('should work with select as second parameter', async () => {
			const userId = testHelper.generateObjectId();

			const homework = await testHelper.createTestHomework({ teacherId: userId, private: false });

			const selectedKeys = ['_id', 'teacherId'];
			const result = await findPublicHomeworksFromUser(userId, selectedKeys);
			expect(result).to.be.an('array').with.lengthOf(1);
			expect(result[0]).to.have.all.keys(selectedKeys);
			expect(result[0]._id.toString()).to.equal(homework._id.toString());
			expect(result[0].teacherId.toString()).to.equal(userId.toString());
		});

		it('should handle private homeworks exist without errors', async () => {
			const userId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: userId, private: true });
			const result = await findPublicHomeworksFromUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: otherUserId });
			const result = await findPublicHomeworksFromUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle unexpected inputs', async () => {
			const userId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: userId });

			// must execute step by step that errors not mixed
			const resultNull = await findPublicHomeworksFromUser(null);
			expect(resultNull, 'when input is null').to.be.an('array').with.lengthOf(0);

			const resultUndefined = await findPublicHomeworksFromUser(undefined);
			expect(resultUndefined, 'when input is undefined').to.be.an('array').with.lengthOf(0);

			try {
				await findPublicHomeworksFromUser('123');
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "123" at path "teacherId" for model "homework"'
				);
			}

			try {
				await findPublicHomeworksFromUser(() => {});
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "[Function (anonymous)]" at path "teacherId" for model "homework"'
				);
			}
		});
	});

	describe('deletePrivateHomeworksFromUser', () => {
		it('should deleted private homeworks from a user in all contexts', async () => {
			const {
				userId,
				otherUserId,
				publicH,
				publicLessonH,
				publicCourseH,
				otherPrivateH,
				otherPrivateLessonH,
				otherPrivateCourseH,
			} = await createHomeworks(testHelper);

			const result = await deletePrivateHomeworksFromUser(userId);
			expect(result).to.be.true;

			// all homeworks that should not deleted
			const [dbResultPublic, dbResultOtherPrivate] = await Promise.all([
				findHomeworks(userId),
				findHomeworks(otherUserId),
			]);
			// public homework still exist
			expect(dbResultPublic).to.be.an('array').with.lengthOf(3);
			expect(dbResultPublic.some(matchId(publicH))).to.be.true;
			expect(dbResultPublic.some(matchId(publicLessonH))).to.be.true;
			expect(dbResultPublic.some(matchId(publicCourseH))).to.be.true;
			// homeworks from other users are not touched
			expect(dbResultOtherPrivate).to.be.an('array').with.lengthOf(3);
			expect(dbResultOtherPrivate.some(matchId(otherPrivateH))).to.be.true;
			expect(dbResultOtherPrivate.some(matchId(otherPrivateLessonH))).to.be.true;
			expect(dbResultOtherPrivate.some(matchId(otherPrivateCourseH))).to.be.true;
		});

		it('should handle no private homeworks exist without errors', async () => {
			const userId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: userId });
			const result = await deletePrivateHomeworksFromUser(userId);
			expect(result).to.be.true;
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: otherUserId });
			const result = await deletePrivateHomeworksFromUser(userId);
			expect(result).to.be.true;
		});

		it('should handle unexpected inputs', async () => {
			const userId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: userId });

			// must execute step by step that errors not mixed
			const resultNull = await deletePrivateHomeworksFromUser(null);
			expect(resultNull, 'when input is null').to.be.true;

			const resultUndefined = await deletePrivateHomeworksFromUser(undefined);
			expect(resultUndefined, 'when input is undefined').to.be.true;

			try {
				await deletePrivateHomeworksFromUser('123');
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "123" at path "teacherId" for model "homework"'
				);
			}

			try {
				await deletePrivateHomeworksFromUser(() => {});
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "[Function (anonymous)]" at path "teacherId" for model "homework"'
				);
			}
		});
	});
});
