import { expect } from 'chai';
import appPromise from '../../../../src/app';
import testObjectsImport from '../../helpers/testObjects'; 
const testObjects = testObjectsImport(appPromise);
import { courseModel } from '../../../../src/services/user-group/model';

describe('course service', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
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
