import { expect } from 'chai';

import appPromise from '../../../src/app';
import testObjectsImport from '../helpers/testObjects'; 
const testObjects = testObjectsImport(appPromise);
import { updatedBy, createdBy, protectFields, validateParams } from '../../../src/services/datasources/hooks';

describe('datasources hooks', () => {
	after(testObjects.cleanup);

	describe('updatedBy', () => {
		const fut = updatedBy;

		it('adds the updatedBy field', async () => {
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
		const fut = createdBy;

		it('adds the createdBy field', async () => {
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
		const fut = protectFields;

		it('censures protected values', async () => {
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
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			const context = await fut({
				result: {
					config: {
						type: 'csv',
						password: 'password123',
						secret: '1234556678',
						public: 'lorem ipsum',
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

		it('works if config has not been returned with result', async () => {
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			const context = await fut({
				result: {
					name: `somename${Date.now()}`,
					schoolId: admin.schoolId,
				},
				params: { account: { userId: admin._id } },
			});
			expect(context).to.not.be.undefined;
			expect(context.result).to.not.be.undefined;
		});

		it('works for FIND', async () => {
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			const context = await fut({
				result: {
					data: [
						{
							config: { type: 'csv', public: 'lorem ipsum' },
							name: `somename${Date.now()}`,
							schoolId: admin.schoolId,
						},
						{
							config: { type: 'webuntis', secret: 'lorem ipsum' },
							name: `somename${Date.now()}`,
							schoolId: admin.schoolId,
							protected: ['secret'],
						},
					],
					total: 2,
					limit: 2,
					skip: 0,
				},
				params: { account: { userId: admin._id } },
				method: 'find',
			});
			expect(context).to.not.be.undefined;
			expect(context.result.data[0].config.public).to.equal('lorem ipsum');
			expect(context.result.data[1].config.secret).to.equal('<secret>');
		});
	});

	describe('validateParams', () => {
		const fut = validateParams;
		it('appends protectedFields to $select when config is selected', async () => {
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			const context = await fut({
				params: {
					account: { userId: admin._id },
					query: {
						$select: ['config'],
					},
				},
			});
			expect(context).to.not.be.undefined;
			expect(context.params.query.$select).to.include('protected');
		});

		it('doesnt append ProtectedFields if config is not selected', async () => {
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			const context = await fut({
				params: {
					account: { userId: admin._id },
					query: {
						$select: ['lastStatus'],
					},
				},
			});
			expect(context).to.not.be.undefined;
			expect(context.params.query.$select).to.not.include('protected');
		});

		it('works if $select is undefined', async () => {
			const admin = await testObjects.createTestUser({ roles: ['administrator'] });
			const context = await fut({
				params: {
					account: { userId: admin._id },
					query: {},
				},
			});
			expect(context).to.not.be.undefined;
			expect(context.params).to.not.be.undefined;
			expect(context.params.query.$select).to.be.undefined;
		});
	});
});
