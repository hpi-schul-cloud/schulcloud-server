const { expect } = require('chai');

const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);
const { updatedBy, createdBy, protectFields } = require('../../../src/services/datasources/hooks');

describe('datasources hooks', () => {
	after(testObjects.cleanup);

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

	describe('protectFields', () => {
		it('censures protected values', async () => {
			const fut = protectFields;
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			const context = await fut({
				result: {
					config: { type: 'csv', secret: '1234556678' },
					name: `somename${Date.now()}`,
					schoolId: admin.schoolId,
					protected: ['secret'],
				},
				params: { account: { userId: admin._id } },
			});
			expect(context).to.not.be.undefined;
			expect(context.result.config.secret).to.equal('<secret>');
		});

		it('always censures password', async () => {
			const fut = protectFields;
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			const context = await fut({
				result: {
					config: {
						type: 'csv', password: 'password123', secret: '1234556678', public: 'lorem ipsum',
					},
					name: `somename${Date.now()}`,
					schoolId: admin.schoolId,
					protected: ['secret'],
				},
				params: { account: { userId: admin._id } },
			});
			expect(context).to.not.be.undefined;
			expect(context.result.config.password).to.equal('<secret>');
			expect(context.result.config.secret).to.equal('<secret>');
			expect(context.result.config.public).to.equal('lorem ipsum');
		});

		it('works if protected is not defined', async () => {
			const fut = protectFields;
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			const context = await fut({
				result: {
					config: { type: 'csv', public: 'lorem ipsum' },
					name: `somename${Date.now()}`,
					schoolId: admin.schoolId,
				},
				params: { account: { userId: admin._id } },
			});
			expect(context).to.not.be.undefined;
			expect(context.result.config.public).to.equal('lorem ipsum');
		});
	});
});
