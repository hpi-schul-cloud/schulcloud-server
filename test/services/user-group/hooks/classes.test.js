const { expect } = require('chai');

const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);

const {
	sortByGradeAndOrName,
	restrictFINDToUsersOwnClasses,
	restrictToUsersOwnClasses,
} = require('../../../../src/services/user-group/hooks/helpers/classHooks');

describe('class hooks', () => {
	describe('sorting method', () => {
		const defaultQuery = { year: 1, gradeLevel: 1, name: 1 };

		it('is returning a value when not provided a sortQuery', () => {
			const context = {
				params: {
					query: { $sort: {} },
				},
			};
			const result = sortByGradeAndOrName(context);
			expect(typeof result).to.equal('object');
			expect(result.params.query.$sort).to.deep.equal(defaultQuery);
		});

		it('is returning a value when not provided query', () => {
			const context = {
				params: {
					query: {},
				},
			};
			const result = sortByGradeAndOrName(context);
			expect(typeof result).to.equal('object');
			expect(result.params.query.$sort).to.deep.equal(defaultQuery);
		});

		it('is returning a value when not provided params', () => {
			const context = {
				params: {},
			};
			const result = sortByGradeAndOrName(context);
			expect(typeof result).to.equal('object');
			expect(result.params.query.$sort).to.deep.equal(defaultQuery);
		});

		it('is returning the correct order', () => {
			const sortQuery = { displayName: -1 };
			const context = {
				params: {
					query: { $sort: sortQuery },
				},
			};
			const result = sortByGradeAndOrName(context);
			expect(result.params.query.$sort).to.deep.equal({ gradeLevel: -1, name: -1 });
		});
	});

	describe('restrictFINDToUsersOwnClasses', () => {
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

		it('should extend the query with user filter for teacher', async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: 'teacher', schoolId: usersSchoolId });

			const originalQuery = { key: 'value' };
			const context = {
				app,
				params: {
					account: { userId: teacher._id },
					query: originalQuery,
				},
			};
			const restrictQuery = { $or: [{ userIds: teacher._id }, { teacherIds: teacher._id }] };
			const expectedQuery = { $and: [restrictQuery, originalQuery] };

			const result = await restrictFINDToUsersOwnClasses(context);
			expect(JSON.stringify(result.params.query)).to.be.deep.equal(JSON.stringify(expectedQuery));
		});

		it('should not extend the query with user filter for admin', async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const admin = await testObjects.createTestUser({ roles: 'administrator', schoolId: usersSchoolId });

			const originalQuery = { key: 'value' };
			const context = {
				app,
				params: {
					account: { userId: admin._id },
					query: originalQuery,
				},
			};

			const result = await restrictFINDToUsersOwnClasses(context);
			expect(JSON.stringify(result.params.query)).to.be.deep.equal(JSON.stringify(originalQuery));
		});

		it('should not extend the query with user filter for superhero', async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const superhero = await testObjects.createTestUser({ roles: 'superhero', schoolId: usersSchoolId });

			const originalQuery = { key: 'value' };
			const context = {
				app,
				params: {
					account: { userId: superhero._id },
					query: originalQuery,
				},
			};

			const result = await restrictFINDToUsersOwnClasses(context);
			expect(JSON.stringify(result.params.query)).to.be.deep.equal(JSON.stringify(originalQuery));
		});
	});

	describe('restrictToUsersOwnClasses', () => {
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

		it('should allow teacher to modify her own class', async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: 'teacher', schoolId: usersSchoolId });

			const klass = await testObjects.createTestClass({ schoolId: usersSchoolId, teacherIds: [teacher._id] });

			const context = {
				app,
				id: klass._id,
				params: {
					account: { userId: teacher._id },
				},
			};

			const result = await restrictToUsersOwnClasses(context);
			expect(result.id.toString()).to.not.be.undefined;
		});

		it("shouldn't allow teacher to modify class to which she doesn't belong", async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: 'teacher', schoolId: usersSchoolId });

			const klass = await testObjects.createTestClass({ schoolId: usersSchoolId });

			const context = {
				app,
				id: klass._id,
				params: {
					account: { userId: teacher._id },
				},
			};

			try {
				await restrictToUsersOwnClasses(context);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.code).to.equal(404);
				expect(err.message).to.equal('class not found');
			}
		});

		it('should allow admin to modify any school class', async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: 'administrator', schoolId: usersSchoolId });

			const klass = await testObjects.createTestClass({ schoolId: usersSchoolId });

			const context = {
				app,
				id: klass._id,
				params: {
					account: { userId: teacher._id },
				},
			};

			const result = await restrictToUsersOwnClasses(context);
			expect(result.id.toString()).to.not.be.undefined;
		});

		it('should allow superhero to modify any school class', async () => {
			const { _id: usersSchoolId } = await testObjects.createTestSchool({});
			const teacher = await testObjects.createTestUser({ roles: 'superhero', schoolId: usersSchoolId });

			const klass = await testObjects.createTestClass({ schoolId: usersSchoolId });

			const context = {
				app,
				id: klass._id,
				params: {
					account: { userId: teacher._id },
				},
			};

			const result = await restrictToUsersOwnClasses(context);
			expect(result).to.not.be.undefined;
		});
	});
});
