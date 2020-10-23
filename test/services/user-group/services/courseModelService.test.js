const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);
const { courseModel } = require('../../../../src/services/user-group/model');

describe('course model service', () => {
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

	it('CREATE a course on internal call', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const { _id: teacherId } = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const result = await app.service('courseModel').create({
			name: 'testcourse',
			schoolId,
			teacherIds: [teacherId],
			substitutionIds: [],
			classIds: [],
			userIds: [],
		});
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

	it('GET a course on internal call', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const { _id: teacherId } = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacherId] });
		const result = await app.service('courseModel').get(course._id);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('_id');
		expect(result).to.haveOwnProperty('name');
		expect(result.schoolId.toString()).to.eq(schoolId.toString());
	});

	it('FIND courses on internal call', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const { _id: teacherId } = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacherId] });
		const result = await app.service('courseModel').find({ query: { _id: course._id } });
		expect(result.data).to.not.be.undefined;
		expect(result.total).to.equal(1);
		expect(result.data[0]).to.haveOwnProperty('_id');
		expect(result.data[0]).to.haveOwnProperty('name');
		expect(result.data[0].schoolId.toString()).to.eq(schoolId.toString());
	});

	it('external call is blocked', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse({ schoolId, teacherIds: [teacher._id] });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		try {
			await app.service('courseModel').get(course._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.eq('should have failed');
			expect(err.code).to.eq(405);
			expect(err.message).to.eq("Provider 'rest' can not call 'get'. (disallow)");
		}
	});
});
