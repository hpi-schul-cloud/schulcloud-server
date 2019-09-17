const { expect } = require('chai');

const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../helpers/services/login')(app);
const { validateData } = require('../../../src/services/datasources/hooks');

describe.only('datasources hooks', () => {
	describe('validateData', () => {
		let server;
		before((done) => {
			server = app.listen(0, done);
		});

		after((done) => {
			server.close(done);
		});

		it('filters and updates data correctly', async () => {
			const fut = validateData;
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			const result = fut({
				data: {
					config: { type: 'csv', otherconfigdata: 'here is more stuff' },
					invalidContent: 'this shouldnt be here',
					schoolId: admin.schoolId,
				},
				params: { account: { userId: admin._id } },
			});
			expect(result).to.not.be.undefined;
			expect(result.data).to.not.be.undefined;
			expect(result.data.config).to.not.be.undefined;
			expect(result.data.config).to.haveOwnProperty('type');
			expect(result.data.config).to.haveOwnProperty('otherconfigdata');
			expect(result.data.invalidContent).to.be.undefined;
			expect(result.data.createdBy.toString()).to.equal(admin._id.toString());
			expect(result.data.schoolId.toString()).to.equal(admin.schoolId.toString());
		});

		it('throws when type is missing', async () => {
			try {
				const fut = validateData;
				const admin = await testObjects.createTestUser({ roles: ['administrator'] });
				fut({
					data: {
						config: { otherconfigdata: 'here is stuff, but no type' },
						invalidContent: 'this shouldnt be here',
						schoolId: admin.schoolId,
					},
					params: { account: { userId: admin._id } },
				});
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(400);
				expect(err.message).to.equal('config should contain a type');
			}
		});
	});
});
