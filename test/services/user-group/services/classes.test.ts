import { expect } from 'chai';
import appPromise from '../../../../src/app';
import testObjectsImport from '../../helpers/testObjects'; 
const testObjects = testObjectsImport(appPromise);
import { classModel } from '../../../../src/services/user-group/model';

describe('classes service', () => {
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

	it('CREATE a class', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		const result = await app.service('classes').create(
			{
				name: 'testclass',
				schoolId: schoolId.toString(),
				teacherIds: [teacher._id],
			},
			params
		);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('_id');
		expect(result.name).to.eq('testclass');
		expect(result.schoolId.toString()).to.eq(schoolId.toString());
		// make sure class was saved to db
		const dbResult = await classModel.findById(result._id).lean().exec();
		expect(dbResult).to.not.be.undefined;
		expect(dbResult).to.haveOwnProperty('_id');
		expect(dbResult.name).to.eq('testclass');
		expect(dbResult.schoolId.toString()).to.eq(schoolId.toString());
	});

	it('GET a class', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const klass = await testObjects.createTestClass({ schoolId, teacherIds: [teacher._id] });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = {};
		const result = await app.service('classes').get(klass._id, params);
		expect(result).to.not.be.undefined;
		expect(result).to.haveOwnProperty('_id');
		expect(result).to.haveOwnProperty('name');
		expect(result.schoolId.toString()).to.eq(schoolId.toString());
	});

	it('FIND classes', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const klass = await testObjects.createTestClass({ schoolId, teacherIds: [teacher._id] });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		params.query = { _id: klass._id };
		const result = await app.service('classes').find(params);
		expect(result.data).to.not.be.undefined;
		expect(result.total).to.equal(1);
		expect(result.data[0]).to.haveOwnProperty('_id');
		expect(result.data[0]).to.haveOwnProperty('name');
		expect(result.data[0].schoolId.toString()).to.eq(schoolId.toString());
	});

	it('PATCH a class', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const klass = await testObjects.createTestClass({ schoolId, teacherIds: [teacher._id] });
		const student = await testObjects.createTestUser({ schoolId, roles: ['student'] });
		const params = await testObjects.generateRequestParamsFromUser(teacher);
		const result = await app.service('classes').patch(klass._id, { $push: { userIds: [student._id] } }, params);
		expect(result).to.not.be.undefined;
		const classUserIds = result.userIds.map((id) => id.toString());
		expect(classUserIds).to.include(student._id.toString());
	});

	describe('security features', () => {
		it('fails unauthorized request', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			const klass = await testObjects.createTestClass({ schoolId, teacherIds: [teacher._id] });
			try {
				await app.service('classes').find({ query: { _id: klass._id }, provider: 'rest' });
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(401);
			}
		});

		it('fails to get class of other school', async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const { _id: classSchoolId } = await testObjects.createTestSchool({});
			const user = await testObjects.createTestUser({ roles: 'administrator', schoolId: usersSchoolId });
			const params = await testObjects.generateRequestParamsFromUser(user);
			params.query = {};
			const klass = await testObjects.createTestClass({ schoolId: classSchoolId });
			try {
				await app.service('classes').get(klass._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
			}
		});

		it('does not find class of other school', async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const { _id: classSchoolId } = await testObjects.createTestSchool({});
			const user = await testObjects.createTestUser({ roles: 'administrator', schoolId: usersSchoolId });
			const params = await testObjects.generateRequestParamsFromUser(user);
			params.query = {};
			await testObjects.createTestClass({ schoolId: classSchoolId });
			const result = await app.service('classes').find(params);
			expect(result.total).to.equal(0);
		});

		it('fails to create class on other school', async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const { _id: classSchoolId } = await testObjects.createTestSchool({});
			const user = await testObjects.createTestUser({ roles: 'administrator', schoolId: usersSchoolId });
			const params = await testObjects.generateRequestParamsFromUser(user);
			const data = {
				name: 'sabotageKlasse',
				teacherIds: [],
				schoolId: classSchoolId,
			};
			try {
				await app.service('classes').create(data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(403);
			}
		});

		it('fails to update class on other school', async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const { _id: classSchoolId } = await testObjects.createTestSchool({});
			const klass = await testObjects.createTestClass({ schoolId: classSchoolId });
			const user = await testObjects.createTestUser({ roles: 'administrator', schoolId: usersSchoolId });
			const params = await testObjects.generateRequestParamsFromUser(user);
			const data = {
				name: 'overtaken',
				teacherIds: [],
				schoolId: usersSchoolId,
			};
			try {
				await app.service('classes').update(klass._id, data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(404);
			}
		});

		it('fails to patch class on other school', async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const { _id: classSchoolId } = await testObjects.createTestSchool({});
			const klass = await testObjects.createTestClass({ schoolId: classSchoolId });
			const user = await testObjects.createTestUser({ roles: 'administrator', schoolId: usersSchoolId });
			const params = await testObjects.generateRequestParamsFromUser(user);
			try {
				await app.service('classes').patch(klass._id, { name: 'hacked' }, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(404);
			}
		});

		it('fails to remove class on other school', async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const { _id: classSchoolId } = await testObjects.createTestSchool({});
			const klass = await testObjects.createTestClass({ schoolId: classSchoolId });
			const user = await testObjects.createTestUser({ roles: 'administrator', schoolId: usersSchoolId });
			const params = await testObjects.generateRequestParamsFromUser(user);
			try {
				await app.service('classes').remove(klass._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(404);
			}
		});
	});
});
