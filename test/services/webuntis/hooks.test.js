const { expect } = require('chai');

const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise);
const { requireDatasourceId } = require('../../../src/services/webuntis/hooks');

describe('webuntis metadata hooks', () => {
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

	describe('requireDatasourceId', () => {
		it('returns if datasource belongs to users school', async () => {
			const fut = requireDatasourceId;
			const { _id: schoolId } = await testObjects.createTestSchool();
			const datasource = await testObjects.createTestDatasource({
				config: { target: 'none' },
				name: 'datasource',
				schoolId,
			});
			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
			const result = await fut({
				app,
				params: {
					account: { userId: admin._id },
					query: {
						datasourceId: datasource._id,
					},
				},
			});
			expect(result).to.not.be.undefined;
		});

		it('fails if no datasourceId is provided', async () => {
			const fut = requireDatasourceId;
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			try {
				await fut({
					app,
					params: {
						account: { userId: admin._id },
						query: {},
					},
				});
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.eq('should have failed');
				expect(err.code).to.eq(400);
				expect(err.message).to.equal('you have to filter by a datasourceId.');
			}
		});

		it('fails if schools dont match', async () => {
			const fut = requireDatasourceId;
			const { _id: userSchoolId } = await testObjects.createTestSchool();
			const { _id: datasourceSchoolId } = await testObjects.createTestSchool();
			const datasource = await testObjects.createTestDatasource({
				config: { target: 'none' },
				name: 'datasource',
				schoolId: datasourceSchoolId,
			});
			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId: userSchoolId });
			try {
				await fut({
					app,
					params: {
						account: { userId: admin._id },
						query: {
							datasourceId: datasource._id,
						},
					},
				});
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.eq('should have failed');
				expect(err.code).to.eq(404);
				expect(err.message).to.equal('no such datasource');
			}
		});

		it('fails if datasource doesnt exist', async () => {
			const fut = requireDatasourceId;
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			try {
				await fut({
					app,
					params: {
						account: { userId: admin._id },
						query: {
							datasourceId: admin._id, // not a datasourceRun id
						},
					},
				});
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.eq('should have failed');
				expect(err.code).to.eq(404);
				expect(err.message).to.equal('no such datasource');
			}
		});
	});
});
