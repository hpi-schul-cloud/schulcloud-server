import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DefaultEncryptionService, EncryptionModule, IEncryptionService, LdapEncryptionService } from '.';

describe('EncryptionModule', () => {
	let module: TestingModule;
	let defaultService: IEncryptionService;
	let ldapService: IEncryptionService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [EncryptionModule, ConfigModule.forRoot({ isGlobal: true })],
		}).compile();
		defaultService = module.get(DefaultEncryptionService);
		ldapService = module.get(LdapEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have the default defined service', () => {
		expect(defaultService).toBeDefined();
	});

	it('should have the ldap defined service', () => {
		expect(ldapService).toBeDefined();
	});
});
