const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);
const {
	computeMembers,
	restrictChangesToArchivedCourse,
} = require('../../../../src/services/user-group/hooks/courses');

const oneHour = 600000;
const twoDays = 172800000;

describe('course hooks', () => {
	describe('restrict changes to archived course', () => {
		const fut = restrictChangesToArchivedCourse;

		it('returns for course that is not expired', async () => {
			const activeCourse = await testObjects.createTestCourse({
				untilDate: Date.now() + oneHour,
			});
			const result = await fut({ app, method: 'update', id: activeCourse._id });
			expect(result).to.not.equal(undefined);
			expect(result.app).to.not.equal(undefined);
			expect(result.method).to.not.equal(undefined);
			expect(result.id).to.not.equal(undefined);
		});

		it('returns for course without end date', async () => {
			const activeCourse = await testObjects.createTestCourse({});
			const result = await fut({ app, method: 'update', id: activeCourse._id });
			expect(result).to.not.equal(undefined);
			expect(result.app).to.not.equal(undefined);
			expect(result.method).to.not.equal(undefined);
			expect(result.id).to.not.equal(undefined);
		});

		it('returns when changing untilDate on expired course', async () => {
			const archivedCourse = await testObjects.createTestCourse({
				untilDate: Date.now() - twoDays,
			});
			const result = await fut({
				app,
				method: 'update',
				id: archivedCourse._id,
				data: {
					startDate: Date.now() - twoDays,
					untilDate: Date.now() + oneHour,
				},
			});
			expect(result).to.not.equal(undefined);
			expect(result.app).to.not.equal(undefined);
			expect(result.method).to.not.equal(undefined);
			expect(result.id).to.not.equal(undefined);
		});

		it('fails when changing other fields of expired course', async () => {
			try {
				const archivedCourse = await testObjects.createTestCourse({
					untilDate: Date.now() - twoDays,
				});
				await fut({
					app,
					method: 'update',
					id: archivedCourse._id,
					data: {
						startDate: Date.now() - twoDays,
						untilDate: Date.now() + oneHour,
						otherField: 'this is set',
					},
				});
				throw (new Error('should have failed'));
			} catch (err) {
				expect(err).to.not.equal(undefined);
				expect(err.message).to.not.equal('should have failed');
			}
		});

		after(testObjects.cleanup);
	});

	describe('computeMembers', () => {
		const users = [];
		const classes = [];

		before(async () => {
			users.push(await testObjects.createTestUser());
			users.push(await testObjects.createTestUser());
			users.push(await testObjects.createTestUser());
			users.push(await testObjects.createTestUser());
			classes.push(await testObjects.createTestClass({ userIds: [users[0]._id, users[1]._id] }));
			classes.push(await testObjects.createTestClass({ userIds: [users[1]._id, users[2]._id] }));
		});

		it('should work for empty courses', async () => {
			const course = await testObjects.createTestCourse();
			const result = await computeMembers(course);
			expect(result.length).to.equal(0);
		});

		it('merges users from classes and the additional users list', async () => {
			const course = await testObjects.createTestCourse({
				userIds: [users[3]._id],
				classIds: [classes[0]._id],
			});

			const result = await computeMembers(course);
			expect(result.length).to.equal(3);
			expect(result).to.include(users[0]._id.toString());
			expect(result).to.include(users[1]._id.toString());
			expect(result).to.include(users[3]._id.toString());
		});

		it('works if only users are given', async () => {
			const course = await testObjects.createTestCourse({
				userIds: [users[1]._id, users[2]._id],
			});

			const result = await computeMembers(course);
			expect(result.length).to.equal(2);
			expect(result).to.include(users[1]._id.toString());
			expect(result).to.include(users[2]._id.toString());
		});

		it('works if only classIds are given', async () => {
			const course = await testObjects.createTestCourse({
				classIds: [classes[1]._id],
			});

			const result = await computeMembers(course);
			expect(result.length).to.equal(2);
			expect(result).to.include(users[1]._id.toString());
			expect(result).to.include(users[2]._id.toString());
		});

		it('removes duplicate ids', async () => {
			const course = await testObjects.createTestCourse({
				userIds: [users[0]._id, users[1]._id, users[2]._id, users[3]._id],
				classIds: [classes[0]._id, classes[1]._id],
			});

			const result = await computeMembers(course);
			expect(result.length).to.equal(4);
			expect(result).to.include(users[0]._id.toString());
			expect(result).to.include(users[1]._id.toString());
			expect(result).to.include(users[2]._id.toString());
			expect(result).to.include(users[3]._id.toString());
		});

		after(testObjects.cleanup);
	});
});
