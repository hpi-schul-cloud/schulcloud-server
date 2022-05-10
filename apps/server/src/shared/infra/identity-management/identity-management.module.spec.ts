import { Test, TestingModule } from '@nestjs/testing';
import { IdentityManagementService } from './identity-management.service';
import { IdentityManagementModule } from './identity-management.module';

describe('IdentityManagementModule', () => {
	let module: TestingModule;
	let idm: IdentityManagementService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [IdentityManagementModule],
		}).compile();
		idm = module.get(IdentityManagementService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined identity management.', () => {
		expect(idm).toBeDefined();
	});
});
