const chai = require('chai');

const testObjects = require('../../../../test/services/helpers/testObjects');
const { SubmissionModel, HomeworkModel } = require('../db');
const { AssertionError } = require('../../../errors');

const {
	findPrivateHomeworksByUser,
	deletePrivateHomeworksFromUser,
	findPublicHomeworkIdsByUser,
	replaceUserInPublicHomeworks,
	findGroupSubmissionIdsByUser,
	findSingleSubmissionsByUser,
	removeGroupSubmissionsConnectionsForUser,
	deleteSingleSubmissionsFromUser,
	findArchivedHomeworkIdsByUser,
	replaceUserInArchivedHomeworks,
} = require('./task.repo');
const { equal, toString: idToString } = require('../../../helper/compare').ObjectId;
const appPromise = require('../../../app');

const { expect } = chai;

const getExpectedUpdateMany = (modifiedDocuments) => ({ success: true, modifiedDocuments });
const getExpectedDeleteMany = (deletedDocuments) => ({ success: true, deletedDocuments });
const getExpectedAssertionError = (paramName) => ({
	assertion_errors: { param: paramName, code: 'REQUIRED_PARAMENTER_MISSING' },
});

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

	const promArchivedCourse = testHelper.createTestHomework({ archived: userId, courseId });
	const promArchivedLesson = testHelper.createTestHomework({ archived: userId, lessonId });
	const promOtherArchivedCourse = testHelper.createTestHomework({ archived: otherUserId, courseId });
	const promOtheArchivedLesson = testHelper.createTestHomework({ archived: otherUserId, lessonId });

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
		archivedC,
		archivedL,
		otherArchivedC,
		otherArchivedL,
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
		promArchivedCourse,
		promArchivedLesson,
		promOtherArchivedCourse,
		promOtheArchivedLesson,
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
		archivedC,
		archivedL,
		otherArchivedC,
		otherArchivedL,
	};
};

const matchId = (ressource) => ({ _id }) => equal(_id, ressource._id);

const db = {};
db.findHomeworks = (userId) => HomeworkModel.find({ teacherId: userId }).lean().exec();
db.findGroupSubmissions = (userId) => SubmissionModel.find({ teamMembers: userId }).lean().exec();
db.findSubmissions = (userId) => SubmissionModel.find({ stundentId: userId }).lean().exec();
db.findArchivedHomework = (userId) => HomeworkModel.find({ archived: userId }).lean().exec();
// TODO find solution without cleanup it before
db.cleanupUnexpectedHomeworks = () =>
	HomeworkModel.deleteMany({ $or: [{ teacherId: null }, { teacherId: undefined }] })
		.lean()
		.exec();

describe.only('in "task.repo" the function', () => {
	let app;
	let server;
	let testHelper;

	before(async () => {
		app = await appPromise;
		testHelper = testObjects(app);
		server = await app.listen(0);
		// cleanup unexpected homework states that create from other tests and not cleanup, or added by seed
		await db.cleanupUnexpectedHomeworks();
	});

	afterEach(async () => {
		await testHelper.cleanup();
	});

	after(async () => {
		await server.close();
	});

	describe('findPrivateHomeworkIdsByUser', () => {
		it('should find private homeworks from a user in all contexts', async () => {
			const { userId, privateH, privateLessonH, privateCourseH } = await createHomeworks(testHelper);

			const result = await findPrivateHomeworksByUser(userId);

			expect(result).to.be.an('array').with.lengthOf(3);
			expect(
				result.map((hw) => idToString(hw._id)),
				'when find private not added homework'
			).to.have.members([idToString(privateH._id), idToString(privateLessonH._id), idToString(privateCourseH._id)]);
		});

		it('should handle no private homeworks exist without errors', async () => {
			const userId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: userId });
			const result = await findPrivateHomeworksByUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: otherUserId });
			const result = await findPrivateHomeworksByUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle unexpected inputs', async () => {
			// must execute step by step that errors not mixed
			const resultNull = await findPrivateHomeworksByUser(null);
			expect(resultNull, 'when input is null').to.be.an('array').with.lengthOf(0);

			const resultUndefined = await findPrivateHomeworksByUser(undefined);
			expect(resultUndefined, 'when input is undefined').to.be.an('array').with.lengthOf(0);

			try {
				await findPrivateHomeworksByUser('123');
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "123" at path "teacherId" for model "homework"'
				);
			}

			try {
				await findPrivateHomeworksByUser(() => {});
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "[Function (anonymous)]" at path "teacherId" for model "homework"'
				);
			}
		});
	});

	describe('findPublicHomeworkIdsByUser', () => {
		it('should find public homeworks from a user in all contexts', async () => {
			const { userId, publicH, publicLessonH, publicCourseH } = await createHomeworks(testHelper);

			const result = await findPublicHomeworkIdsByUser(userId);

			expect(result).to.be.an('array').with.lengthOf(3);
			// from DB and model is public homework without lesson and course possible, it is only force by client controller
			expect(result.some(matchId(publicH)), 'find public not added homework').to.be.true;
			expect(result.some(matchId(publicLessonH)), 'find public lesson homework').to.be.true;
			expect(result.some(matchId(publicCourseH)), 'find public course homework').to.be.true;
		});

		it('should handle private homeworks exist without errors', async () => {
			const userId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: userId, private: true });
			const result = await findPublicHomeworkIdsByUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: otherUserId });
			const result = await findPublicHomeworkIdsByUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle unexpected inputs', async () => {
			// must execute step by step that errors not mixed
			const resultNull = await findPublicHomeworkIdsByUser(null);
			expect(resultNull, 'when input is null').to.be.an('array').with.lengthOf(0);

			const resultUndefined = await findPublicHomeworkIdsByUser(undefined);
			expect(resultUndefined, 'when input is undefined').to.be.an('array').with.lengthOf(0);

			try {
				await findPublicHomeworkIdsByUser('123');
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "123" at path "teacherId" for model "homework"'
				);
			}

			try {
				await findPublicHomeworkIdsByUser(() => {});
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
			expect(result).to.eql(getExpectedDeleteMany(3));

			// all homeworks that should not deleted
			const [dbResultPublic, dbResultOtherPrivate] = await Promise.all([
				db.findHomeworks(userId),
				db.findHomeworks(otherUserId),
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
			expect(result).to.eql(getExpectedDeleteMany(0));
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: otherUserId });
			const result = await deletePrivateHomeworksFromUser(userId);
			expect(result).to.eql(getExpectedDeleteMany(0));
		});

		it('should handle unexpected inputs', async () => {
			// must execute step by step that errors not mixed

			expect(deletePrivateHomeworksFromUser(null))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
			expect(deletePrivateHomeworksFromUser(undefined))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
			expect(deletePrivateHomeworksFromUser('123'))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
			expect(deletePrivateHomeworksFromUser(() => {}))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
		});
	});

	describe('replaceUserInPublicHomeworks', () => {
		it('should replace user in public homeworks in all contexts', async () => {
			const replaceUserId = testHelper.generateObjectId();
			const {
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
			} = await createHomeworks(testHelper);

			const result = await replaceUserInPublicHomeworks(userId, replaceUserId);
			expect(result).to.eql(getExpectedUpdateMany(3));

			const [dbResultUser, dbResultOther, dbResultReplaceUser] = await Promise.all([
				db.findHomeworks(userId),
				db.findHomeworks(otherUserId),
				db.findHomeworks(replaceUserId),
			]);
			// private homework still exist
			expect(dbResultUser).to.be.an('array').with.lengthOf(3);
			expect(dbResultUser.some(matchId(privateH))).to.be.true;
			expect(dbResultUser.some(matchId(privateLessonH))).to.be.true;
			expect(dbResultUser.some(matchId(privateCourseH))).to.be.true;
			// public user is replaced
			expect(dbResultReplaceUser).to.be.an('array').with.lengthOf(3);
			expect(dbResultReplaceUser.some(matchId(publicH))).to.be.true;
			expect(dbResultReplaceUser.some(matchId(publicLessonH))).to.be.true;
			expect(dbResultReplaceUser.some(matchId(publicCourseH))).to.be.true;
			// homeworks from other users are not touched
			expect(dbResultOther).to.be.an('array').with.lengthOf(3);
			expect(dbResultOther.some(matchId(otherPrivateH))).to.be.true;
			expect(dbResultOther.some(matchId(otherPrivateLessonH))).to.be.true;
			expect(dbResultOther.some(matchId(otherPrivateCourseH))).to.be.true;
		});

		it('should handle no public homeworks exist without errors', async () => {
			const replaceUserId = testHelper.generateObjectId();
			const userId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: userId, private: true });
			const result = await replaceUserInPublicHomeworks(userId, replaceUserId);
			expect(result).to.eql(getExpectedUpdateMany(0));
		});

		it('should handle no user matched without errors', async () => {
			const replaceUserId = testHelper.generateObjectId();
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: otherUserId });
			const result = await replaceUserInPublicHomeworks(userId, replaceUserId);
			expect(result).to.eql(getExpectedUpdateMany(0));
		});

		it('should handle unexpected first parameter inputs', async () => {
			const replaceUserId = testHelper.generateObjectId();
			const userId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: userId });

			expect(replaceUserInPublicHomeworks(null, replaceUserId))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
			expect(replaceUserInPublicHomeworks(undefined, replaceUserId))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
			expect(replaceUserInPublicHomeworks('123', replaceUserId))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
			expect(replaceUserInPublicHomeworks(() => {}, replaceUserId))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
		});

		it('should handle unexpected second parameter inputs', async () => {
			const userId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: userId });
			// must execute step by step that errors not mixed

			expect(replaceUserInPublicHomeworks(userId, null))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('replaceUserId'));
			expect(replaceUserInPublicHomeworks(userId, undefined))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('replaceUserId'));
			expect(replaceUserInPublicHomeworks(userId, '123'))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('replaceUserId'));
			expect(replaceUserInPublicHomeworks(userId, () => {}))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('replaceUserId'));
		});
	});

	describe('findGroupSubmissionIdsByUser', () => {
		it('should find only all group submissions', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();
			const otherUserId2 = testHelper.generateObjectId();

			const groupAloneProm = testHelper.createTestSubmission({ studentId: userId, teamMembers: [userId] });
			const groupOwnerProm = testHelper.createTestSubmission({ studentId: userId, teamMembers: [userId, otherUserId] });
			const groupAsTeamMemberProm = testHelper.createTestSubmission({
				studentId: otherUserId,
				teamMembers: [otherUserId, userId],
			});
			const otherGroupSubmissionProm = testHelper.createTestSubmission({
				studentId: otherUserId,
				teamMembers: [otherUserId2, otherUserId],
			});

			const [groupAlone, groupOwner, groupAsTeamMember] = await Promise.all([
				groupAloneProm,
				groupOwnerProm,
				groupAsTeamMemberProm,
				otherGroupSubmissionProm,
			]);
			const result = await findGroupSubmissionIdsByUser(userId);
			expect(result).to.be.an('array').with.lengthOf(3);
			expect(result.some(matchId(groupAlone)), 'where user is alone in group').to.be.true;
			expect(result.some(matchId(groupOwner)), 'where user is teammember and owner').to.be.true;
			expect(result.some(matchId(groupAsTeamMember)), 'where user is a teammeber but no owner').to.be.true;
		});

		it('should handle no group submission exist without errors', async () => {
			const userId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: userId });
			const result = await findGroupSubmissionIdsByUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: otherUserId, teamMebers: [otherUserId] });
			const result = await findGroupSubmissionIdsByUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle unexpected inputs', async () => {
			// must execute step by step that errors not mixed
			const resultNull = await findGroupSubmissionIdsByUser(null);
			expect(resultNull, 'when input is null').to.be.an('array').with.lengthOf(0);

			const resultUndefined = await findGroupSubmissionIdsByUser(undefined);
			expect(resultUndefined, 'when input is undefined').to.be.an('array').with.lengthOf(0);

			try {
				await findGroupSubmissionIdsByUser('123');
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "123" at path "teamMembers" for model "submission"'
				);
			}

			try {
				await findGroupSubmissionIdsByUser(() => {});
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "[Function (anonymous)]" at path "teamMembers" for model "submission"'
				);
			}
		});
	});

	describe('removeGroupSubmissionsConnectionsForUser', () => {
		it('should remove all group connection in submissions', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();
			const otherUserId2 = testHelper.generateObjectId();

			const groupAloneProm = testHelper.createTestSubmission({ studentId: userId, teamMembers: [userId] });
			const groupOwnerProm = testHelper.createTestSubmission({ studentId: userId, teamMembers: [userId, otherUserId] });
			const groupAsTeamMemberProm = testHelper.createTestSubmission({
				studentId: otherUserId,
				teamMembers: [otherUserId, userId],
			});
			const otherGroupSubmissionProm = testHelper.createTestSubmission({
				studentId: otherUserId,
				teamMembers: [otherUserId2, otherUserId],
			});

			const [groupAlone, groupOwner, groupAsTeamMember] = await Promise.all([
				groupAloneProm,
				groupOwnerProm,
				groupAsTeamMemberProm,
				otherGroupSubmissionProm,
			]);
			const status = await removeGroupSubmissionsConnectionsForUser(userId);
			expect(status).to.eql(getExpectedUpdateMany(3));

			const result = await db.findGroupSubmissions(userId);
			expect(result.some(matchId(groupAlone)), 'where user is alone in group').to.be.false;
			expect(result.some(matchId(groupOwner)), 'where user is teammember and owner').to.be.false;
			expect(result.some(matchId(groupAsTeamMember)), 'where user is a teammeber but no owner').to.be.false;
		});

		it('should handle no group submission exist without errors', async () => {
			const userId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: userId });
			const result = await removeGroupSubmissionsConnectionsForUser(userId);
			expect(result).to.eql(getExpectedUpdateMany(0));
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: otherUserId, teamMebers: [otherUserId] });
			const result = await removeGroupSubmissionsConnectionsForUser(userId);
			expect(result).to.eql(getExpectedUpdateMany(0));
		});

		it('should handle unexpected inputs', async () => {
			// must execute step by step that errors not mixed

			expect(removeGroupSubmissionsConnectionsForUser(null))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
			expect(removeGroupSubmissionsConnectionsForUser(undefined))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
			expect(removeGroupSubmissionsConnectionsForUser('123'))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
			expect(removeGroupSubmissionsConnectionsForUser(() => {}))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
		});
	});

	describe('findSingleSubmissionIdsByUser', () => {
		it('should find all submissions', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			const submission = await testHelper.createTestSubmission({ studentId: userId });
			const submission2 = await testHelper.createTestSubmission({ studentId: userId });
			// submission of other user
			await testHelper.createTestSubmission({ studentId: otherUserId });

			const result = await findSingleSubmissionsByUser(userId);
			expect(result).to.be.an('array').with.lengthOf(2);
			expect(result.map((sm) => idToString(sm._id))).to.have.members([
				idToString(submission._id),
				idToString(submission2._id),
			]);
		});

		it('should handle no submission exist without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: otherUserId });
			const result = await findSingleSubmissionsByUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: otherUserId });
			const result = await findSingleSubmissionsByUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle unexpected inputs', async () => {
			// must execute step by step that errors not mixed
			const resultNull = await findSingleSubmissionsByUser(null);
			expect(resultNull, 'when input is null').to.be.an('array').with.lengthOf(0);

			const resultUndefined = await findSingleSubmissionsByUser(undefined);
			expect(resultUndefined, 'when input is undefined').to.be.an('array').with.lengthOf(0);

			try {
				await findSingleSubmissionsByUser('123');
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "123" at path "studentId" for model "submission"'
				);
			}

			try {
				await findSingleSubmissionsByUser(() => {});
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "[Function (anonymous)]" at path "studentId" for model "submission"'
				);
			}
		});
	});

	describe('deleteSingleSubmissionsFromUser', () => {
		it('should remove all submissions', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			const submissionProm = testHelper.createTestSubmission({ studentId: userId });
			const otherSubmissionProm = testHelper.createTestSubmission({ studentId: otherUserId });

			const [submission, otherSubmission] = await Promise.all([submissionProm, otherSubmissionProm]);

			const result = await deleteSingleSubmissionsFromUser(userId);
			expect(result).to.eql(getExpectedDeleteMany(1));

			const dbResult = await db.findSubmissions(userId);
			expect(dbResult.some(matchId(submission))).to.be.false;
			expect(dbResult.some(matchId(otherSubmission))).to.be.false;
		});

		it('should handle no submission exist without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: otherUserId });
			const result = await deleteSingleSubmissionsFromUser(userId);
			expect(result).to.eql(getExpectedDeleteMany(0));
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: otherUserId });
			const result = await deleteSingleSubmissionsFromUser(userId);
			expect(result).to.eql(getExpectedDeleteMany(0));
		});

		it('should handle unexpected inputs', async () => {
			// must execute step by step that errors not mixed

			expect(deleteSingleSubmissionsFromUser(null))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
			expect(deleteSingleSubmissionsFromUser(undefined))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
			expect(deleteSingleSubmissionsFromUser('123'))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
			expect(deleteSingleSubmissionsFromUser(() => {}))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
		});
	});

	describe('findArchivedHomeworkIdsByUser', () => {
		it('should find archived homeworks from a user in all contexts', async () => {
			const { userId, archivedC, archivedL } = await createHomeworks(testHelper);

			const result = await findArchivedHomeworkIdsByUser(userId);

			expect(result).to.be.an('array').with.lengthOf(2);
			expect(result.some(matchId(archivedC)), 'find archived homework for course').to.be.true;
			expect(result.some(matchId(archivedL)), 'find archived homework for lesson').to.be.true;
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ archived: otherUserId });
			const result = await findArchivedHomeworkIdsByUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle unexpected inputs', async () => {
			const resultNull = await findArchivedHomeworkIdsByUser(null);
			expect(resultNull, 'when input is null').to.be.an('array').with.lengthOf(0);

			const resultUndefined = await findArchivedHomeworkIdsByUser(undefined);
			expect(resultUndefined, 'when input is undefined').to.be.an('array').with.lengthOf(0);

			try {
				await findArchivedHomeworkIdsByUser('123');
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "123" at path "teamMembers" for model "submission"'
				);
			}

			try {
				await findArchivedHomeworkIdsByUser(() => {});
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "[Function (anonymous)]" at path "teamMembers" for model "submission"'
				);
			}
		});
	});

	describe('replaceUserInArchivedHomeworks', () => {
		it('should replace user in archived homeworks in all contexts', async () => {
			const replaceUserId = testHelper.generateObjectId();
			const { userId, otherUserId, archivedC, archivedL, otherArchivedC, otherArchivedL } = await createHomeworks(
				testHelper
			);

			const result = await replaceUserInArchivedHomeworks(userId, replaceUserId);
			expect(result).to.eql(getExpectedUpdateMany(2));

			const [dbResultUser, dbResultOther, dbResultReplaceUser] = await Promise.all([
				db.findArchivedHomework(userId),
				db.findArchivedHomework(otherUserId),
				db.findArchivedHomework(replaceUserId),
			]);
			// there is no archived homework with the user
			expect(dbResultUser).to.be.an('array').with.lengthOf(0);

			// archived user is replaced
			expect(dbResultReplaceUser).to.be.an('array').with.lengthOf(2);
			expect(dbResultReplaceUser.some(matchId(archivedC))).to.be.true;
			expect(dbResultReplaceUser.some(matchId(archivedL))).to.be.true;
			// homeworks from other users are not touched
			expect(dbResultOther).to.be.an('array').with.lengthOf(2);
			expect(dbResultOther.some(matchId(otherArchivedC))).to.be.true;
			expect(dbResultOther.some(matchId(otherArchivedL))).to.be.true;
		});

		it('should handle no matching archived homeworks exist without errors', async () => {
			const replaceUserId = testHelper.generateObjectId();
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ archived: otherUserId, private: true });
			const result = await replaceUserInArchivedHomeworks(userId, replaceUserId);
			expect(result).to.eql(getExpectedUpdateMany(0));
		});

		it('should handle unexpected first parameter inputs', async () => {
			const replaceUserId = testHelper.generateObjectId();
			const userId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ archived: userId });
			// must execute step by step that errors not mixed
			expect(replaceUserInArchivedHomeworks(null, replaceUserId))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
			expect(replaceUserInArchivedHomeworks(undefined, replaceUserId))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
			expect(replaceUserInArchivedHomeworks('123', replaceUserId))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
			expect(replaceUserInArchivedHomeworks(() => {}, replaceUserId))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('userId'));
		});

		it('should handle unexpected second parameter inputs', async () => {
			const userId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ archived: userId });
			// must execute step by step that errors not mixed
			expect(replaceUserInArchivedHomeworks(userId, null))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('replaceUserId'));
			expect(replaceUserInArchivedHomeworks(userId, undefined))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('replaceUserId'));
			expect(replaceUserInArchivedHomeworks(userId, '123'))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('replaceUserId'));
			expect(replaceUserInArchivedHomeworks(userId, () => {}))
				.to.eventually.throw(AssertionError)
				.with.property(getExpectedAssertionError('replaceUserId'));
		});
	});
});
