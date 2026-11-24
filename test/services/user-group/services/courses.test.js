const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const appPromise = require('../../../../src/app');
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');
const testObjects = require('../../helpers/testObjects')(appPromise());
const { courseModel } = require('../../../../src/services/user-group/model');
const { FileModel } = require('../../../../src/services/fileStorage/model');
const { homeworkModel, submissionModel } = require('../../../../src/services/homework/model');
const { LessonModel } = require('../../../../src/services/lesson/model');

describe('course service', () => {
	let app;
	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	it('CREATE a course', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		const result = await app.service('courses').create(
			{
				name: 'testcourse',
				schoolId: schoolId.toString(),
				teacherIds: [teacher._id],
				substitutionIds: [],
				classIds: [],
				userIds: [],
			},
			params
		);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('_id');
		expect(result.name).to.eq('testcourse');
		expect(result.schoolId.toString()).to.eq(schoolId.toString());
		// make sure course was saved to db
		const dbResult = await courseModel.findById(result._id).lean().exec();
		expect(dbResult).to.not.be.undefined;
		expect(dbResult).to.haveOwnProperty('_id');
		expect(dbResult.name).to.eq('testcourse');
		expect(dbResult.schoolId.toString()).to.eq(schoolId.toString());
	});

	it('GET a course', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		const result = await app.service('courses').get(course._id, params);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('_id');
		expect(result).to.haveOwnProperty('name');
		expect(result.schoolId.toString()).to.eq(schoolId.toString());
	});

	it('FIND courses', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = { _id: course._id };
		const result = await app.service('courses').find(params);
		expect(result.data).to.not.be.undefined;
		expect(result.total).to.equal(1);
		expect(result.data[0]).to.haveOwnProperty('_id');
		expect(result.data[0]).to.haveOwnProperty('name');
		expect(result.data[0].schoolId.toString()).to.eq(schoolId.toString());
	});

	it('PATCH a course', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		const result = await app
			.service('courses')
			.patch(course._id, { description: 'this description has been changed' }, params);
		expect(result).to.not.be.undefined;
		expect(result.description).to.eq('this description has been changed');
	});

	it('REMOVE a course and its dependent lessons', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const otherCourse = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const courseGroup = await testObjects.createTestCourseGroup({ schoolId, courseId: course._id, userIds: [] });
		const otherCourseGroup = await testObjects.createTestCourseGroup({ schoolId, courseId: otherCourse._id, userIds: [] });

		const directLesson = await testObjects.createTestLesson({ courseId: course._id });
		const courseGroupLesson = await testObjects.createTestLesson({ courseGroupId: courseGroup._id });
		const unrelatedCourseLesson = await testObjects.createTestLesson({ courseId: otherCourse._id });
		const unrelatedCourseGroupLesson = await testObjects.createTestLesson({ courseGroupId: otherCourseGroup._id });

		const params = await testObjects.generateRequestParamsFromUser(teacher);
		const result = await app.service('courses').remove(course._id, params);

		expect(result).to.not.be.undefined;
		expect(await LessonModel.findById(directLesson._id).lean().exec()).to.be.null;
		expect(await LessonModel.findById(courseGroupLesson._id).lean().exec()).to.be.null;
		expect(await courseModel.findById(course._id).lean().exec()).to.be.null;
		expect(await app.service('courseGroupModel').get(courseGroup._id).catch(() => null)).to.be.null;
		expect(await LessonModel.findById(unrelatedCourseLesson._id).lean().exec()).to.not.be.null;
		expect(await LessonModel.findById(unrelatedCourseGroupLesson._id).lean().exec()).to.not.be.null;
		expect(await app.service('courseGroupModel').get(otherCourseGroup._id)).to.not.be.null;
	});

	it('REMOVE a course and its dependent files', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const otherCourse = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const courseFile = await FileModel.create({
			isDirectory: false,
			name: 'course-file.txt',
			type: 'text/plain',
			size: 12,
			storageFileName: 'course-file.txt',
			bucket: 'bucket-test',
			storageProviderId: teacher._id,
			owner: course._id,
			refOwnerModel: 'course',
			creator: teacher._id,
			permissions: [{ refId: teacher._id, refPermModel: 'user', read: true, write: true, create: true, delete: true }],
		});
		const unrelatedCourseFile = await FileModel.create({
			isDirectory: false,
			name: 'other-course-file.txt',
			type: 'text/plain',
			size: 12,
			storageFileName: 'other-course-file.txt',
			bucket: 'bucket-test',
			storageProviderId: teacher._id,
			owner: otherCourse._id,
			refOwnerModel: 'course',
			creator: teacher._id,
			permissions: [{ refId: teacher._id, refPermModel: 'user', read: true, write: true, create: true, delete: true }],
		});

		const params = await testObjects.generateRequestParamsFromUser(teacher);
		await app.service('courses').remove(course._id, params);

		expect(await FileModel.findById(courseFile._id).lean().exec()).to.be.null;
		expect((await FileModel.findOneWithDeleted({ _id: courseFile._id }).lean().exec()).deleted).to.be.true;
		expect(await FileModel.findById(unrelatedCourseFile._id).lean().exec()).to.not.be.null;
	});

	it('REMOVE a course and its dependent homework', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id], userIds: [student._id] });
		const otherCourse = await testObjects.createTestCourse({
			schoolId,
			teacherIds: [teacher._id],
			userIds: [student._id],
		});
		const homework = await testObjects.createTestHomework({
			schoolId,
			teacherId: teacher._id,
			courseId: course._id,
		});
		const lesson = await testObjects.createTestLesson({ courseId: course._id });
		const lessonHomework = await testObjects.createTestHomework({
			schoolId,
			teacherId: teacher._id,
			courseId: course._id,
			lessonId: lesson._id,
		});
		const unrelatedHomework = await testObjects.createTestHomework({
			schoolId,
			teacherId: teacher._id,
			courseId: otherCourse._id,
		});
		const homeworkSubmission = await testObjects.createTestSubmission({
			schoolId,
			studentId: student._id,
			homeworkId: homework._id,
		});
		const lessonHomeworkSubmission = await testObjects.createTestSubmission({
			schoolId,
			studentId: student._id,
			homeworkId: lessonHomework._id,
		});
		const unrelatedSubmission = await testObjects.createTestSubmission({
			schoolId,
			studentId: student._id,
			homeworkId: unrelatedHomework._id,
		});

		const params = await testObjects.generateRequestParamsFromUser(teacher);
		await app.service('courses').remove(course._id, params);

		expect(await homeworkModel.findById(homework._id).lean().exec()).to.be.null;
		expect(await homeworkModel.findById(lessonHomework._id).lean().exec()).to.be.null;
		expect(await submissionModel.findById(homeworkSubmission._id).lean().exec()).to.be.null;
		expect(await submissionModel.findById(lessonHomeworkSubmission._id).lean().exec()).to.be.null;
		expect(await homeworkModel.findById(unrelatedHomework._id).lean().exec()).to.not.be.null;
		expect(await submissionModel.findById(unrelatedSubmission._id).lean().exec()).to.not.be.null;
	});

	describe('security features', () => {
		it('can not CREATE course on different school', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const { _id: otherSchoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			try {
				await app.service('courses').create(
					{
						name: 'testcourse',
						schoolId: otherSchoolId.toString(),
						teacherIds: [teacher._id],
						substitutionIds: [],
						classIds: [],
						userIds: [],
					},
					params
				);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal('You do not have valid permissions to access this.');
			}
		});

		it('can not GET course on different school', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const { _id: otherSchoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({ otherSchoolId, teacherIds: teacher._id });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			try {
				await app.service('courses').get(course._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal('Die angefragte Gruppe gehört nicht zur eigenen Schule!');
			}
		});

		it('can not GET course the user is not in', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({ schoolId });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			try {
				await app.service('courses').get(course._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal('You are not in that course.');
			}
		});

		it('can not GET course the user is not in even with a valid link', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({ schoolId });
			const link = await app.service('link').create({ target: `/courses/${course._id}` });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = { link: link._id };

			try {
				await app.service('courses').get(course._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal('You are not in that course.');
			} finally {
				await app.service('link').remove(link._id);
			}
		});

		it('can not FIND course the user is not in', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({ schoolId });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = { _id: course._id };
			const result = await app.service('courses').find(params);
			expect(result.total).to.equal(0);
		});

		it('can not REMOVE course the user is not in', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({ schoolId });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			try {
				await app.service('courses').remove(course._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal(`User ${teacher._id} ist nicht Teil des Kurses`);
			}
		});

		it('can not PATCH course the user is not in', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({ schoolId });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			try {
				await app.service('courses').patch(course._id, { description: 'this description has been changed' }, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal(`User ${teacher._id} ist nicht Teil des Kurses`);
			}
		});

		it('can not PATCH course the user is not in even with a valid link', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({ schoolId });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			const storedCourse = await courseModel.findById(course._id).lean().exec();
			const link = await app.service('link').create({ target: `/courses/${course._id}` });
			params.query = { link: link._id };

			try {
				try {
					await app.service('courses').patch(course._id, { description: 'unauthorized change' }, params);
					throw new Error('should have failed');
				} catch (err) {
					expect(err.message).to.not.equal('should have failed');
					expect(err.code).to.equal(403);
					expect(err.message).to.equal(`User ${teacher._id} ist nicht Teil des Kurses`);
				}
				expect(await courseModel.findById(course._id).lean().exec()).to.deep.equal(storedCourse);
			} finally {
				await app.service('link').remove(link._id);
			}
		});

		it('can not PATCH course as a member without COURSE_EDIT even with a valid link', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const course = await testObjects.createTestCourse({ schoolId, userIds: [student._id] });
			const params = await testObjects.generateRequestParamsFromUser(student);
			const storedCourse = await courseModel.findById(course._id).lean().exec();
			const link = await app.service('link').create({ target: `/courses/${course._id}` });
			params.query = { link: link._id };

			try {
				try {
					await app.service('courses').patch(course._id, { description: 'unauthorized change' }, params);
					throw new Error('should have failed');
				} catch (err) {
					expect(err.message).to.not.equal('should have failed');
					expect(err.code).to.equal(403);
					expect(err.message).to.equal('Missing one of the required permissions COURSE_EDIT.');
				}
				expect(await courseModel.findById(course._id).lean().exec()).to.deep.equal(storedCourse);
			} finally {
				await app.service('link').remove(link._id);
			}
		});

		it('can not UPDATE course the user is not in', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({ schoolId });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			try {
				await app.service('courses').update(
					course._id,
					{
						name: 'changedName',
						schoolId: schoolId.toString(),
						teacherIds: [teacher._id],
						substitutionIds: [],
						classIds: [],
						userIds: [],
					},
					params
				);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
				expect(err.message).to.equal(`User ${teacher._id} ist nicht Teil des Kurses`);
			}
		});
	});

	describe('teacher and substitution teacher validation', () => {
		const invalidTeachersMessage =
			'teacherIds and substitutionIds may only contain existing users with the teacher role.';
		const invalidDataMessage = 'Invalid course data.';
		const createdCourseIds = [];

		after(async () => {
			await courseModel.deleteMany({ _id: { $in: createdCourseIds } }).exec();
		});

		const setup = async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const otherTeacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			return { schoolId, teacher, otherTeacher, student, admin, params };
		};

		const buildCourseData = (schoolId, data) => ({
			name: 'testcourse',
			schoolId: schoolId.toString(),
			teacherIds: [],
			substitutionIds: [],
			classIds: [],
			userIds: [],
			...data,
		});

		const expectBadRequest = async (request, message) => {
			try {
				await request;
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(400);
				expect(err.message).to.equal(message);
			}
		};

		const expectNoCourseInSchool = async (schoolId) => {
			expect(await courseModel.countDocuments({ schoolId }).exec()).to.equal(0);
		};

		const toIdStrings = (ids) => ids.map((id) => id.toString());

		it('can not CREATE a course with a student as teacher', async () => {
			const { schoolId, teacher, otherTeacher, student, params } = await setup();
			const data = buildCourseData(schoolId, {
				teacherIds: [teacher._id.toString(), otherTeacher._id.toString(), student._id.toString()],
			});

			await expectBadRequest(app.service('courses').create(data, params), invalidTeachersMessage);
			await expectNoCourseInSchool(schoolId);
		});

		it('can not CREATE a course with a student as substitution teacher', async () => {
			const { schoolId, teacher, student, params } = await setup();
			const data = buildCourseData(schoolId, {
				teacherIds: [teacher._id.toString()],
				substitutionIds: [student._id.toString()],
			});

			await expectBadRequest(app.service('courses').create(data, params), invalidTeachersMessage);
			await expectNoCourseInSchool(schoolId);
		});

		it('can not CREATE a course with a user without teacher role as teacher', async () => {
			const { schoolId, teacher, admin, params } = await setup();
			const data = buildCourseData(schoolId, { teacherIds: [teacher._id.toString(), admin._id.toString()] });

			await expectBadRequest(app.service('courses').create(data, params), invalidTeachersMessage);
			await expectNoCourseInSchool(schoolId);
		});

		it('can not CREATE a course with a non existing user as teacher', async () => {
			const { schoolId, teacher, params } = await setup();
			const data = buildCourseData(schoolId, {
				teacherIds: [teacher._id.toString(), new ObjectId().toString()],
			});

			await expectBadRequest(app.service('courses').create(data, params), invalidTeachersMessage);
			await expectNoCourseInSchool(schoolId);
		});

		it('can not CREATE a course with malformed teacher ids', async () => {
			const { schoolId, teacher, student, params } = await setup();
			const malformedIds = [
				'not-an-id',
				'',
				'aaaaaaaaaaaa',
				{ _id: student._id.toString() },
				{ $in: [student._id.toString()] },
				[student._id.toString()],
			];

			for (const malformedId of malformedIds) {
				const data = buildCourseData(schoolId, { teacherIds: [teacher._id.toString(), malformedId] });
				// eslint-disable-next-line no-await-in-loop
				await expectBadRequest(app.service('courses').create(data, params), invalidTeachersMessage);
			}
			await expectNoCourseInSchool(schoolId);
		});

		it('can not CREATE a course with mongo operators or dotted keys', async () => {
			const { schoolId, teacher, student, params } = await setup();
			const injections = [
				{ 'substitutionIds.0': student._id.toString() },
				{ $set: { substitutionIds: [student._id.toString()] } },
			];

			for (const injection of injections) {
				const data = { ...buildCourseData(schoolId, { teacherIds: [teacher._id.toString()] }), ...injection };
				// eslint-disable-next-line no-await-in-loop
				await expectBadRequest(app.service('courses').create(data, params), invalidDataMessage);
			}
			await expectNoCourseInSchool(schoolId);
		});

		it('can not CREATE courses with array data', async () => {
			const { schoolId, teacher, params } = await setup();
			const data = [buildCourseData(schoolId, { teacherIds: [teacher._id.toString()] })];

			await expectBadRequest(app.service('courses').create(data, params), invalidDataMessage);
			await expectNoCourseInSchool(schoolId);
		});

		it('CREATE a course with valid teachers and substitution teachers', async () => {
			const { schoolId, teacher, otherTeacher, params } = await setup();
			const teacherAndAdmin = await testObjects.createTestUser({ roles: ['teacher', 'administrator'], schoolId });
			const data = buildCourseData(schoolId, {
				teacherIds: [teacher._id.toString(), otherTeacher._id.toString()],
				substitutionIds: [teacherAndAdmin._id.toString()],
			});

			const result = await app.service('courses').create(data, params);
			createdCourseIds.push(result._id);

			const dbResult = await courseModel.findById(result._id).lean().exec();
			expect(toIdStrings(dbResult.teacherIds)).to.have.members([teacher._id.toString(), otherTeacher._id.toString()]);
			expect(toIdStrings(dbResult.substitutionIds)).to.have.members([teacherAndAdmin._id.toString()]);
		});

		it('CREATE a course with a single teacher id', async () => {
			const { schoolId, teacher, params } = await setup();
			const data = buildCourseData(schoolId, { teacherIds: teacher._id.toString() });

			const result = await app.service('courses').create(data, params);
			createdCourseIds.push(result._id);

			const dbResult = await courseModel.findById(result._id).lean().exec();
			expect(toIdStrings(dbResult.teacherIds)).to.have.members([teacher._id.toString()]);
		});

		it('can not PATCH a student into teachers or substitution teachers', async () => {
			const { schoolId, teacher, student, params } = await setup();
			const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
			const storedCourse = await courseModel.findById(course._id).lean().exec();
			const payloads = [
				{ teacherIds: [teacher._id.toString(), student._id.toString()] },
				{ teacherIds: [teacher._id.toString()], substitutionIds: [student._id.toString()] },
			];

			for (const payload of payloads) {
				// eslint-disable-next-line no-await-in-loop
				await expectBadRequest(app.service('courses').patch(course._id, payload, params), invalidTeachersMessage);
			}
			expect(await courseModel.findById(course._id).lean().exec()).to.deep.equal(storedCourse);
		});

		it('can not PATCH a course with mongo operators or dotted keys', async () => {
			const { schoolId, teacher, student, params } = await setup();
			const course = await testObjects.createTestCourse({
				schoolId,
				teacherIds: [teacher._id],
				userIds: [student._id],
			});
			const storedCourse = await courseModel.findById(course._id).lean().exec();
			const studentId = student._id.toString();
			const payloads = [
				{ $push: { teacherIds: studentId } },
				{ $addToSet: { substitutionIds: studentId } },
				{ $set: { teacherIds: [studentId] } },
				{ $rename: { userIds: 'teacherIds' } },
				{ 'teacherIds.1': studentId },
			];

			for (const payload of payloads) {
				// eslint-disable-next-line no-await-in-loop
				await expectBadRequest(app.service('courses').patch(course._id, payload, params), invalidDataMessage);
			}
			expect(await courseModel.findById(course._id).lean().exec()).to.deep.equal(storedCourse);
		});

		it('PATCH a course with valid teachers and substitution teachers', async () => {
			const { schoolId, teacher, otherTeacher, params } = await setup();
			const substitutionTeacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });

			await app.service('courses').patch(
				course._id,
				{
					teacherIds: [teacher._id.toString(), otherTeacher._id.toString()],
					substitutionIds: [substitutionTeacher._id.toString()],
				},
				params
			);

			const dbResult = await courseModel.findById(course._id).lean().exec();
			expect(toIdStrings(dbResult.teacherIds)).to.have.members([teacher._id.toString(), otherTeacher._id.toString()]);
			expect(toIdStrings(dbResult.substitutionIds)).to.have.members([substitutionTeacher._id.toString()]);
		});

		it('can not UPDATE a course with a student as teacher', async () => {
			const { schoolId, teacher, student, params } = await setup();
			const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
			const storedCourse = await courseModel.findById(course._id).lean().exec();
			const data = buildCourseData(schoolId, {
				teacherIds: [teacher._id.toString(), student._id.toString()],
			});

			await expectBadRequest(app.service('courses').update(course._id, data, params), invalidTeachersMessage);
			expect(await courseModel.findById(course._id).lean().exec()).to.deep.equal(storedCourse);
		});

		it('UPDATE a course with valid teachers', async () => {
			const { schoolId, teacher, otherTeacher, params } = await setup();
			const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
			const data = buildCourseData(schoolId, {
				name: 'changedName',
				teacherIds: [teacher._id.toString(), otherTeacher._id.toString()],
			});

			await app.service('courses').update(course._id, data, params);

			const dbResult = await courseModel.findById(course._id).lean().exec();
			expect(dbResult.name).to.equal('changedName');
			expect(toIdStrings(dbResult.teacherIds)).to.have.members([teacher._id.toString(), otherTeacher._id.toString()]);
		});

		it('does not validate internal calls', async () => {
			const { schoolId, student } = await setup();

			const course = await testObjects.createTestCourse({ schoolId, substitutionIds: [student._id] });

			expect(toIdStrings(course.substitutionIds)).to.have.members([student._id.toString()]);
		});
	});

	describe('populate restrictions', () => {
		it('only recieve allowed attributes of populated students', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const course = await testObjects.createTestCourse({
				schoolId,
				teacherIds: [teacher._id],
				userIds: [student._id],
			});
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = { $populate: ['userIds'] };
			const result = await app.service('courses').get(course._id, params);
			expect(result).to.not.be.undefined;
			expect(result.userIds).to.exist;
			expect(result.userIds.length).to.equal(1);
			expect(result.userIds[0]).to.haveOwnProperty('_id');
			expect(result.userIds[0]).to.haveOwnProperty('firstName');
			expect(result.userIds[0]).to.not.haveOwnProperty('email');
		});

		it('only recieve allowed attributes of populated teachers', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const course = await testObjects.createTestCourse({
				schoolId,
				teacherIds: [teacher._id],
				userIds: [student._id],
			});
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = { $populate: ['teacherIds'] };
			const result = await app.service('courses').get(course._id, params);
			expect(result).to.not.be.undefined;
			expect(result.teacherIds).to.exist;
			expect(result.teacherIds.length).to.equal(1);
			expect(result.teacherIds[0]).to.haveOwnProperty('_id');
			expect(result.teacherIds[0]).to.haveOwnProperty('firstName');
			expect(result.teacherIds[0]).to.not.haveOwnProperty('email');
		});

		it('only recieve allowed attributes of populated classes', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId });
			const klass = await testObjects.createTestClass({ userIds: [student.userId], schoolId });
			const course = await testObjects.createTestCourse({
				schoolId,
				teacherIds: [teacher._id],
				classIds: [klass._id],
			});
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = { $populate: ['classIds'] };
			const result = await app.service('courses').get(course._id, params);
			expect(result).to.not.be.undefined;
			expect(result.classIds).to.exist;
			expect(result.classIds.length).to.equal(1);
			expect(result.classIds[0]).to.haveOwnProperty('_id');
			expect(result.classIds[0]).to.haveOwnProperty('displayName');
			expect(result.classIds[0]).to.not.haveOwnProperty('userIds');
		});

		it('can not populate school', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({
				schoolId,
				teacherIds: [teacher._id],
			});
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = { $populate: ['schoolId'] };
			try {
				await app.service('courses').get(course._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should not have failed');
				expect(err.code).to.equal(400);
				expect(err.message).to.equal('populate not supported');
			}
		});

		it('can not populate on create', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = { $populate: ['schoolId'] };
			try {
				await app.service('courses').create(
					{
						name: 'testcourse',
						schoolId: schoolId.toString(),
						teacherIds: [teacher._id],
						substitutionIds: [],
						classIds: [],
						userIds: [],
					},
					params
				);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should not have failed');
				expect(err.code).to.equal(400);
				expect(err.message).to.equal('populate not supported');
			}
		});

		it('can not populate on patch', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = { $populate: ['schoolId'] };
			try {
				await app.service('courses').patch(course._id, { description: 'this description has been changed' }, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should not have failed');
				expect(err.code).to.equal(400);
				expect(err.message).to.equal('populate not supported');
			}
		});

		it('can not populate on update', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = { $populate: ['schoolId'] };
			try {
				await app.service('courses').update(course._id, { description: 'this description has been changed' }, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should not have failed');
				expect(err.code).to.equal(400);
				expect(err.message).to.equal('populate not supported');
			}
		});

		it('can not populate on remove', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
			const params = await testObjects.generateRequestParamsFromUser(teacher);
			params.query = { $populate: ['schoolId'] };
			try {
				await app.service('courses').remove(course._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should not have failed');
				expect(err.code).to.equal(400);
				expect(err.message).to.equal('populate not supported');
			}
		});
	});
});
