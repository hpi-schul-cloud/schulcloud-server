const { expect } = require('chai');

const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);
const { requireDatasourceRunId } = require('../../../src/services/webuntis/hooks');

describe('webuntis metadata hooks', () => {
	describe('requireDatasourceRunId', () => {
		it('returns if datasource belongs to users school', async () => {
			const fut = requireDatasourceRunId;
			const { _id: schoolId } = await testObjects.createTestSchool();
			const datasource = await testObjects.createTestDatasource({
				config: { target: 'none' },
				name: 'datasource',
				schoolId,
			});
			const run = await app.service('datasourceRuns').create({ datasourceId: datasource._id });
			const admin = await testObjects.createTestUser({ roles: ['administrator'], schoolId });
			const result = await fut({
				app,
				params: {
					account: { userId: admin._id },
					query: {
						datasourceRunId: run._id,
					},
				},
			});
			expect(result).to.not.be.undefined;
		});

		it('fails if no datasourceRunId is provided', async () => {
			const fut = requireDatasourceRunId;
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
				expect(err.message).to.equal('you have to filter by a datasourceRunId.');
			}
		});

		it('fails if schools dont match'/* , async () => {
			const fut = requireDatasourceRunId;
			const { _id: userSchoolId } = await testObjects.createTestSchool();
			const { _id: datasourceSchoolId } = await testObjects.createTestSchool();
			const datasource = await testObjects.createTestDatasource({
				config: { target: 'none' },
				name: 'datasource',
				datasourceSchoolId,
			});
			const run = await app.service('datasourceRuns').create({ datasourceId: datasource._id });
			const admin = await testObjects.createTestUser({ roles: ['administrator'], userSchoolId });
			try {
				await fut({
					app,
					params: {
						account: { userId: admin._id },
						query: {
							datasourceRunId: run._id,
						},
					},
				});
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.eq('should have failed');
				expect(err.code).to.eq(403);
				expect(err.message).to.equal('no such datasourceRun');
			}
		} */);

		it('fails if datasourceRun doesnt exist');
	});
});
