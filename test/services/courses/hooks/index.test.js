const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);
const { restrictChangesToArchivedCourse } = require('../../../../src/services/user-group/hooks/courses');

const oneHour = 600000;
const twoDays = 172800000;

describe('course hooks', () => {
	let app;
	let server;
	before(async () => {
		app = await appPromise;
		server = app.listen(0);
	});

	after(() => {
		server.close();
	});

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
				throw new Error('should have failed');
			} catch (err) {
				expect(err).to.not.equal(undefined);
				expect(err.message).to.not.equal('should have failed');
			}
		});
	});
});
