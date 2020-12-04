const chai = require('chai');

const testObjects = require('../../../../test/services/helpers/testObjects');
const { SubmissionModel, HomeworkModel } = require('../db');
const { findPrivateHomeworksFromUser, deletePrivateHomeworksFromUser } = require('./task.repo');
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

	const promNotPrivate = testHelper.createTestHomework({ teacherId: userId, private: false });
	const promNotPrivateLesson = testHelper.createTestHomework({ teacherId: userId, private: false, lessonId });
	const promNotPrivateCourse = testHelper.createTestHomework({ teacherId: userId, private: false, courseId });

	const promOtherPrivate = testHelper.createTestHomework({ teacherId: otherUserId, private: true });
	const promOtherPrivateLesson = testHelper.createTestHomework({ teacherId: otherUserId, private: true, lessonId });
	const promOtherPrivateCourse = testHelper.createTestHomework({ teacherId: otherUserId, private: true, courseId });

	const [privateH, lessonH, courseH, h1, h2, h3, h4, h5, h6] = await Promise.all([
		promPrivate,
		promPrivateLesson,
		promPrivateCourse,
		// other homeworks marked as h1 and should not touched
		promNotPrivate,
		promNotPrivateLesson,
		promNotPrivateCourse,
		promOtherPrivate,
		promOtherPrivateLesson,
		promOtherPrivateCourse,
	]);

	return {
		userId,
		otherUserId,
		private: {
			privateH,
			lessonH,
			courseH,
		},
		notPrivate: {
			h1,
			h2,
			h3,
		},
		others: {
			h4,
			h5,
			h6,
		},
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
			const {
				userId,
				private: { privateH, lessonH, courseH },
			} = await createHomeworks(testHelper);

			const result = await findPrivateHomeworksFromUser(userId);

			expect(result).to.be.an('array').with.lengthOf(3);
			expect(result.some(matchId(privateH)), 'find private not added homework').to.be.true;
			expect(result.some(matchId(lessonH)), 'find private lesson homework').to.be.true;
			expect(result.some(matchId(courseH)), 'find private course homework').to.be.true;
		});

		it('should handle no private homeworks exist without errors', () => {
			// private not exist
		});

		it('should handle no user matched without errors', () => {
			// userId not exist
		});

		it('should handle unexpected inputs', () => {
			// function, null, undefined, string
		});
	});

	describe('deletePrivateHomeworksFromUser', () => {
		it('should deleted private homeworks from a user in all contexts', async () => {
			const {
				userId,
				otherUserId,
				notPrivate: { h1, h2, h3 },
				others: { h4, h5, h6 },
			} = await createHomeworks(testHelper);

			const result = await deletePrivateHomeworksFromUser(userId);
			expect(result).to.be.true;

			// all homeworks that should not deleted
			const [dbResultNotPrivate, dbResultOther] = await Promise.all([
				findHomeworks(userId),
				findHomeworks(otherUserId),
			]);
			// not private homework still exist
			expect(dbResultNotPrivate).to.be.an('array').with.lengthOf(3);
			expect(dbResultNotPrivate.some(matchId(h1))).to.be.true;
			expect(dbResultNotPrivate.some(matchId(h2))).to.be.true;
			expect(dbResultNotPrivate.some(matchId(h3))).to.be.true;
			// homeworks from other users are not touched
			expect(dbResultOther).to.be.an('array').with.lengthOf(3);
			expect(dbResultOther.some(matchId(h4))).to.be.true;
			expect(dbResultOther.some(matchId(h5))).to.be.true;
			expect(dbResultOther.some(matchId(h6))).to.be.true;
		});
	});
});
