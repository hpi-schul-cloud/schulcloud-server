const chai = require('chai');

const testObjects = require('../../../../test/services/helpers/testObjects');
const { SubmissionModel, HomeworkModel } = require('../db');
const {
	findPrivateHomeworksFromUser,
	deletePrivateHomeworksFromUser,
	findPublicHomeworksFromUser,
	replaceUserInPublicHomeworks,
	findGroupSubmissionsFromUser,
	findSingleSubmissionsFromUser,
	removeGroupSubmissionsConnectionsForUser,
	deleteSingleSubmissionsFromUser,
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

// TODO: simplify to find all and in test match id
const groupSubmissionQuery = (userId) => ({ $and: [{ teamMembers: userId }, { teamMembers: { $ne: null } }] });
const matchId = (ressource) => ({ _id }) => _id.toString() === ressource._id.toString();

const db = {};
db.findHomeworks = (userId) => HomeworkModel.find({ teacherId: userId }).lean().exec();
db.findGroupSubmissions = (userId) => SubmissionModel.find(groupSubmissionQuery(userId)).lean().exec();
db.findSubmissions = (userId) => SubmissionModel.find({ stundentId: userId }).lean().exec();
db.cleanupUnexpectedHomeworks = () =>
	HomeworkModel.deleteMany({ $or: [{ teacherId: null }, { teacherId: undefined }] })
		.lean()
		.exec();

describe('in "task.repo" the function', () => {
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
			// cleanup null and undefined matched homeworks, because seed data include invalid data
			const result = await db.cleanupUnexpectedHomeworks();
			expect(result.ok, 'but cleanup before must work').to.equal(1);

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
			expect(result).to.eql({ success: 1, modified: 3 });

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
			expect(result).to.eql({ success: 1, modified: 0 });
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: otherUserId });
			const result = await deletePrivateHomeworksFromUser(userId);
			expect(result).to.eql({ success: 1, modified: 0 });
		});

		it('should handle unexpected inputs', async () => {
			// must execute step by step that errors not mixed
			try {
				await deletePrivateHomeworksFromUser(null);
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is null').to.equal('The parameter "userId" is not defined.');
			}

			try {
				await deletePrivateHomeworksFromUser(undefined);
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is undefined').to.equal('The parameter "userId" is not defined.');
			}

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
			expect(result).to.eql({ success: 1, modified: 3 });

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
			expect(result).to.eql({ success: 1, modified: 0 });
		});

		it('should handle no user matched without errors', async () => {
			const replaceUserId = testHelper.generateObjectId();
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: otherUserId });
			const result = await replaceUserInPublicHomeworks(userId, replaceUserId);
			expect(result).to.eql({ success: 1, modified: 0 });
		});

		it('should handle unexpected first parameter inputs', async () => {
			const replaceUserId = testHelper.generateObjectId();
			const userId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: userId });
			// must execute step by step that errors not mixed
			try {
				await replaceUserInPublicHomeworks(null, replaceUserId);
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is null').to.equal('The parameter "userId" is not defined.');
			}

			try {
				await replaceUserInPublicHomeworks(undefined, replaceUserId);
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is undefined').to.equal('The parameter "userId" is not defined.');
			}

			try {
				await replaceUserInPublicHomeworks('123', replaceUserId);
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "123" at path "teacherId" for model "homework"'
				);
			}

			try {
				await replaceUserInPublicHomeworks(() => {}, replaceUserId);
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "[Function (anonymous)]" at path "teacherId" for model "homework"'
				);
			}
		});

		it('should handle unexpected second parameter inputs', async () => {
			const userId = testHelper.generateObjectId();

			await testHelper.createTestHomework({ teacherId: userId });
			// must execute step by step that errors not mixed
			const resultNull = await replaceUserInPublicHomeworks(userId, null);
			expect(resultNull, 'when input is null').to.eql({ success: 1, modified: 1 });

			const resultUndefined = await replaceUserInPublicHomeworks(userId, undefined);
			expect(resultUndefined, 'when input is undefined').to.eql({ success: 1, modified: 0 });

			try {
				await replaceUserInPublicHomeworks(userId, '123');
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "123" at path "teacherId"'
				);
			}

			try {
				await replaceUserInPublicHomeworks(userId, () => {});
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "[Function (anonymous)]" at path "teacherId"'
				);
			}
		});
	});

	describe('findGroupSubmissionsFromUser', () => {
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
			const result = await findGroupSubmissionsFromUser(userId);
			expect(result).to.be.an('array').with.lengthOf(3);
			expect(result.some(matchId(groupAlone)), 'where user is alone in group').to.be.true;
			expect(result.some(matchId(groupOwner)), 'where user is teammember and owner').to.be.true;
			expect(result.some(matchId(groupAsTeamMember)), 'where user is a teammeber but no owner').to.be.true;
		});

		it('should work with select as second parameter', async () => {
			const userId = testHelper.generateObjectId();

			const homework = await testHelper.createTestSubmission({ studentId: userId, teamMembers: [userId] });

			const selectedKeys = ['_id', 'studentId'];
			const result = await findGroupSubmissionsFromUser(userId, selectedKeys);
			expect(result).to.be.an('array').with.lengthOf(1);
			expect(result[0]).to.have.all.keys(selectedKeys);
			expect(result[0]._id.toString()).to.equal(homework._id.toString());
			expect(result[0].studentId.toString()).to.equal(userId.toString());
		});

		it('should handle no group submission exist without errors', async () => {
			const userId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: userId });
			const result = await findGroupSubmissionsFromUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: otherUserId, teamMebers: [otherUserId] });
			const result = await findGroupSubmissionsFromUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle unexpected inputs', async () => {
			// must execute step by step that errors not mixed
			const resultNull = await findGroupSubmissionsFromUser(null);
			expect(resultNull, 'when input is null').to.be.an('array').with.lengthOf(0);

			const resultUndefined = await findGroupSubmissionsFromUser(undefined);
			expect(resultUndefined, 'when input is undefined').to.be.an('array').with.lengthOf(0);

			try {
				await findGroupSubmissionsFromUser('123');
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "123" at path "teamMembers" for model "submission"'
				);
			}

			try {
				await findGroupSubmissionsFromUser(() => {});
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
			expect(status).to.eql({ success: 1, modified: 3 });

			const result = await db.findGroupSubmissions(userId);
			expect(result.some(matchId(groupAlone)), 'where user is alone in group').to.be.false;
			expect(result.some(matchId(groupOwner)), 'where user is teammember and owner').to.be.false;
			expect(result.some(matchId(groupAsTeamMember)), 'where user is a teammeber but no owner').to.be.false;
		});

		it('should handle no group submission exist without errors', async () => {
			const userId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: userId });
			const result = await removeGroupSubmissionsConnectionsForUser(userId);
			expect(result).to.eql({ success: 1, modified: 0 });
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: otherUserId, teamMebers: [otherUserId] });
			const result = await removeGroupSubmissionsConnectionsForUser(userId);
			expect(result).to.eql({ success: 1, modified: 0 });
		});

		it('should handle unexpected inputs', async () => {
			// must execute step by step that errors not mixed
			try {
				await removeGroupSubmissionsConnectionsForUser(null);
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is null').to.equal('The parameter "userId" is not defined.');
			}

			try {
				await removeGroupSubmissionsConnectionsForUser(undefined);
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is undefined').to.equal('The parameter "userId" is not defined.');
			}

			try {
				await removeGroupSubmissionsConnectionsForUser('123');
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "123" at path "teamMembers" for model "submission"'
				);
			}

			try {
				await removeGroupSubmissionsConnectionsForUser(() => {});
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "[Function (anonymous)]" at path "teamMembers" for model "submission"'
				);
			}
		});
	});

	describe('findSingleSubmissionsFromUser', () => {
		it('should find all submissions', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			const submissionProm = testHelper.createTestSubmission({ studentId: userId });
			const otherSubmissionProm = testHelper.createTestSubmission({ studentId: otherUserId });

			const [submission] = await Promise.all([submissionProm, otherSubmissionProm]);

			const result = await findSingleSubmissionsFromUser(userId);
			expect(result).to.be.an('array').with.lengthOf(1);
			expect(result.some(matchId(submission))).to.be.true;
		});

		it('should handle no submission exist without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: otherUserId });
			const result = await findSingleSubmissionsFromUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: otherUserId });
			const result = await findSingleSubmissionsFromUser(userId);
			expect(result).to.be.an('array').with.lengthOf(0);
		});

		it('should handle unexpected inputs', async () => {
			// must execute step by step that errors not mixed
			const resultNull = await findSingleSubmissionsFromUser(null);
			expect(resultNull, 'when input is null').to.be.an('array').with.lengthOf(0);

			const resultUndefined = await findSingleSubmissionsFromUser(undefined);
			expect(resultUndefined, 'when input is undefined').to.be.an('array').with.lengthOf(0);

			try {
				await findSingleSubmissionsFromUser('123');
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "123" at path "studentId" for model "submission"'
				);
			}

			try {
				await findSingleSubmissionsFromUser(() => {});
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
			expect(result).to.eql({ success: 1, modified: 1 });

			const dbResult = await db.findSubmissions(userId);
			expect(dbResult.some(matchId(submission))).to.be.false;
			expect(dbResult.some(matchId(otherSubmission))).to.be.false;
		});

		it('should handle no submission exist without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: otherUserId });
			const result = await deleteSingleSubmissionsFromUser(userId);
			expect(result).to.eql({ success: 1, modified: 0 });
		});

		it('should handle no user matched without errors', async () => {
			const userId = testHelper.generateObjectId();
			const otherUserId = testHelper.generateObjectId();

			await testHelper.createTestSubmission({ studentId: otherUserId });
			const result = await deleteSingleSubmissionsFromUser(userId);
			expect(result).to.eql({ success: 1, modified: 0 });
		});

		it('should handle unexpected inputs', async () => {
			// must execute step by step that errors not mixed
			try {
				await deleteSingleSubmissionsFromUser(null);
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is null').to.equal('The parameter "userId" is not defined.');
			}

			try {
				await deleteSingleSubmissionsFromUser(undefined);
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is undefined').to.equal('The parameter "userId" is not defined.');
			}

			try {
				await deleteSingleSubmissionsFromUser('123');
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "123" at path "studentId" for model "submission"'
				);
			}

			try {
				await deleteSingleSubmissionsFromUser(() => {});
				throw new Error('test failed');
			} catch (err) {
				expect(err.message, 'when input is not bson string').to.equal(
					'Cast to ObjectId failed for value "[Function (anonymous)]" at path "studentId" for model "submission"'
				);
			}
		});
	});
});
