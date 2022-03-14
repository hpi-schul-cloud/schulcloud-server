import { Test, TestingModule } from '@nestjs/testing';
import { IIdentityManagement } from './identity-management.interface';
import { IdentityManagementModule } from './identity-management.module';

describe('IdentityManagementModule', () => {
	let module: TestingModule;
	let idm: IIdentityManagement;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [IdentityManagementModule],
		}).compile();
		idm = module.get('IdentityManagement');
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined identity management.', () => {
		expect(idm).toBeDefined();
	});
});
