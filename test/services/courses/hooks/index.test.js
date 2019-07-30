const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);
const { restrictChangesToArchivedCourse } = require('../../../../src/services/user-group/hooks/courses');

describe('course hooks', () => {
	describe('restrict changes to archived course', () => {
		const fut = restrictChangesToArchivedCourse;

		it('returns for course that is not expired', async () => {
			const activeCourse = await testObjects.createTestCourse({
				untilDate: Date.now() + 600000,
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
				untilDate: Date.now() - 172800000,
			});
			const result = await fut({
				app,
				method: 'update',
				id: archivedCourse._id,
				data: {
					startDate: Date.now() - 172800000,
					untilDate: Date.now() + 600000,
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
					untilDate: Date.now() - 172800000,
				});
				await fut({
					app,
					method: 'update',
					id: archivedCourse._id,
					data: {
						startDate: Date.now() - 172800000,
						untilDate: Date.now() + 600000,
						otherField: 'this is set',
					},
				});
				throw (new Error('should have failed'));
			} catch (err) {
				expect(err).to.not.equal(undefined);
				expect(err.message).to.not.equal('should have failed');
			}
		});
	});
});
