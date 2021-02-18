const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);
const { classModel } = require('../../../../src/services/user-group/model');
const { equal: equalIds } = require('../../../../src/helper/compare').ObjectId;

describe('classes service', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	afterEach(testObjects.cleanup);

	after(async () => {
		await server.close();
	});

	it('is properly registered', () => {
		expect(app.service('classes')).to.not.equal(undefined);
	});

	describe('FIND', () => {
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

		it('FIND classes with pagination query', async () => {
			const { _id: schoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
			await testObjects.createTestClass({ schoolId, teacherIds: [teacher._id] });
			await testObjects.createTestClass({ schoolId, teacherIds: [teacher._id] });
			const params = await testObjects.generateRequestParamsFromUser(teacher);

			params.query = { $limit: 1, $skip: 0, $or: [{ teacherIds: teacher._id }, { userIds: teacher._id }] };

			const result = await app.service('classes').find(params);
			expect(result.data).to.not.be.undefined;
			expect(result.total).to.equal(1);
			expect(result.data[0]).to.haveOwnProperty('_id');
			expect(result.data[0]).to.haveOwnProperty('name');
			expect(result.data[0].schoolId.toString()).to.eq(schoolId.toString());
		});

		it('should allow admins to find all classes', async () => {
			const adminUser = await testObjects.createTestUser({
				roles: ['administrator'],
			});

			const classes = [
				await testObjects.createTestClass({
					name: Math.random(),
					teacherIds: [adminUser._id],
					schoolId: adminUser.schoolId,
				}),
				await testObjects.createTestClass({
					name: Math.random(),
					teacherIds: [adminUser._id],
					schoolId: adminUser.schoolId,
				}),
				await testObjects.createTestClass({
					name: Math.random(),
					schoolId: adminUser.schoolId,
				}),
			];

			const params = {
				query: {},
				...(await testObjects.generateRequestParamsFromUser(adminUser)),
			};
			const { data } = await app.service('classes').find(params);
			expect(data.length).to.equal(classes.length);
			// all created classes should be in the response:
			expect(classes.reduce((agg, cur) => agg && data.some((d) => equalIds(d._id, cur._id)), true)).to.equal(true);
		}).timeout(4000);

		it('should allow students to only find classes they participate in', async () => {
			const studentUser = await testObjects.createTestUser({ roles: ['student'] });

			const classes = [
				await testObjects.createTestClass({
					name: Math.random(),
					schoolId: studentUser.schoolId,
					userIds: [studentUser._id],
				}),
				await testObjects.createTestClass({
					name: Math.random(),
					schoolId: studentUser.schoolId,
				}),
				await testObjects.createTestClass({
					name: Math.random(),
				}),
			];

			const params = {
				query: {},
				...(await testObjects.generateRequestParamsFromUser(studentUser)),
			};
			const { data } = await app.service('classes').find(params);
			expect(data.length).to.equal(1);
			expect(data[0]._id.toString()).to.equal(classes[0]._id.toString());
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

		it('should display the classes in correct order', async () => {
			const adminUser = await testObjects.createTestUser({ roles: ['administrator'] });

			const classes = [
				await testObjects.createTestClass({
					name: 'C',
				}),
				await testObjects.createTestClass({
					name: 'B',
				}),
				await testObjects.createTestClass({
					name: 'A',
				}),
			];

			const adminParams = {
				query: {},
				...(await testObjects.generateRequestParamsFromUser(adminUser)),
			};

			const { data } = await app.service('classes').find(adminParams);
			expect(data.length).to.equal(3);
			expect(data[0].displayName).to.equal(classes[2].displayName);
			expect(data[1].displayName).to.equal(classes[1].displayName);
			expect(data[2].displayName).to.equal(classes[0].displayName);
		});

		it('should display the classes in correct order when gradelevel is included', async () => {
			const adminUser = await testObjects.createTestUser({ roles: ['administrator'] });

			const classes = [
				await testObjects.createTestClass({
					name: 'C',
					gradeLevel: 2,
				}),
				await testObjects.createTestClass({
					name: 'B',
					gradeLevel: 9,
				}),
				await testObjects.createTestClass({
					name: 'A',
					gradeLevel: 7,
				}),
			];

			const adminParams = {
				query: {},
				...(await testObjects.generateRequestParamsFromUser(adminUser)),
			};
			const { data } = await app.service('classes').find(adminParams);

			expect(data.length).to.equal(3);
			expect(data[0].displayName).to.equal(classes[0].displayName);
			expect(data[1].displayName).to.equal(classes[2].displayName);
			expect(data[2].displayName).to.equal(classes[1].displayName);
		});

		it('should display the classes in correct order when years are included', async () => {
			const { _id } = await testObjects.createTestSchool();
			const school = await app.service('schools').get(_id);
			const adminUser = await testObjects.createTestUser({ roles: ['administrator'] });

			const classes = [
				await testObjects.createTestClass({
					name: 'A',
					year: school.years.schoolYears[0],
				}),
				await testObjects.createTestClass({
					name: 'A',
					year: school.years.schoolYears[1],
				}),
				await testObjects.createTestClass({
					name: 'B',
					year: school.years.schoolYears[0],
				}),
			];

			const adminParams = {
				query: {},
				...(await testObjects.generateRequestParamsFromUser(adminUser)),
			};
			const { data } = await app.service('classes').find(adminParams);

			expect(data.length).to.equal(3);
			expect(data[0].displayName).to.equal(classes[0].displayName);
			expect(data[1].displayName).to.equal(classes[2].displayName);
			expect(data[2].displayName).to.equal(classes[1].displayName);
		});
	});

	describe('GET', () => {
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
	});

	describe('CREATE', () => {
		const createdIds = [];

		after(async () => {
			await testObjects.classes.removeMany(createdIds);
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
			createdIds.push(result._id);
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

		it('CREATE patches successor ID in predecessor class', async () => {
			const orgClass = await app.service('classes').create({
				name: 'sonnenklasse 1',
				schoolId: '5f2987e020834114b8efd6f8',
			});
			createdIds.push(orgClass._id);
			const successorClass = await app.service('classes').create({
				name: 'sonnenklasse 2',
				schoolId: '5f2987e020834114b8efd6f8',
				predecessor: orgClass._id,
			});
			createdIds.push(successorClass._id);
			const updatedOrgClass = await app.service('classes').get(orgClass._id);
			expect(updatedOrgClass.name).to.equal('sonnenklasse 1');
			expect(successorClass.name).to.equal('sonnenklasse 2');
			expect(updatedOrgClass.successor.toString()).to.equal(successorClass._id.toString());
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
	});

	describe('PATCH', () => {
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

		it("fails to patch class to which the teacher doesn't belong", async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: 'teacher', schoolId: usersSchoolId });

			const anotherClass = await testObjects.createTestClass({ schoolId: usersSchoolId });

			const params = await testObjects.generateRequestParamsFromUser(teacher);
			try {
				await app.service('classes').patch(anotherClass._id, { name: 'hacked' }, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.code).to.equal(404);
				expect(err.message).to.be.equal('class not found');
			}
		});
	});

	describe('UPDATE', () => {
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

		it("fails to update class to which the teacher doesn't belong", async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: 'teacher', schoolId: usersSchoolId });

			const anotherClass = await testObjects.createTestClass({ schoolId: usersSchoolId });

			const params = await testObjects.generateRequestParamsFromUser(teacher);
			const data = {
				name: 'overtaken',
				teacherIds: [],
				schoolId: usersSchoolId,
			};
			try {
				await app.service('classes').update(anotherClass._id, data, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.code).to.equal(404);
				expect(err.message).to.be.equal('class not found');
			}
		});
	});

	describe('REMOVE', () => {
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

		it("fails to remove class to which the teacher doesn't belong", async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: 'teacher', schoolId: usersSchoolId });

			const anotherClass = await testObjects.createTestClass({ schoolId: usersSchoolId });

			const params = await testObjects.generateRequestParamsFromUser(teacher);
			try {
				await app.service('classes').remove(anotherClass._id, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.code).to.equal(404);
				expect(err.message).to.be.equal('class not found');
			}
		});
	});
});
