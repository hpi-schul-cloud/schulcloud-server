const { expect } = require('chai');

const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);
const { updatedBy, createdBy } = require('../../../src/services/datasources/hooks');

describe('datasources hooks', () => {
	describe('updatedBy', () => {
		it('adds the updatedBy field', async () => {
			const fut = updatedBy;
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			const result = fut({
				data: {
					config: { type: 'csv' },
				},
				params: { account: { userId: admin._id } },
			});
			expect(result).to.not.be.undefined;
			expect(result.data.updatedBy.toString()).to.equal(admin._id.toString());
		});
	});

	describe('createdBy', () => {
		it('adds the createdBy field', async () => {
			const fut = createdBy;
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			const result = fut({
				data: {
					config: { type: 'csv' },
					name: `somename${Date.now()}`,
					schoolId: admin.schoolId,
				},
				params: { account: { userId: admin._id } },
			});
			expect(result).to.not.be.undefined;
			expect(result.data.createdBy.toString()).to.equal(admin._id.toString());
		});
	});
});
