import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ACCOUNT_CONFIG_TOKEN } from './account-config';
import { AccountModule } from './account.module';
import { AccountIdmToDoMapper, AccountIdmToDoMapperDb, AccountIdmToDoMapperIdm } from './domain';
import { AccountService } from './domain/services/account.service';
import { ACCOUNT_ENCRYPTION_CONFIG_TOKEN } from './encryption.config';
import { AccountEntity } from './repo';

const encryptionKey = 'test-aes-key-1234';

describe('AccountModule', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [AccountModule, MongoMemoryDatabaseModule.forRoot({ entities: [AccountEntity] })],
		})
			.overrideProvider(ACCOUNT_ENCRYPTION_CONFIG_TOKEN)
			.useValue({ aesKey: encryptionKey })
			.overrideProvider(ACCOUNT_CONFIG_TOKEN)
			.useValue({
				identityManagementStoreEnabled: false,
				identityManagementLoginEnabled: false,
			})
			.compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have the account service defined', () => {
		const accountService = module.get(AccountService);
		expect(accountService).toBeDefined();
	});

	describe('when FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED is enabled', () => {
		let moduleFeatureEnabled: TestingModule;

		beforeAll(async () => {
			moduleFeatureEnabled = await Test.createTestingModule({
				imports: [AccountModule, MongoMemoryDatabaseModule.forRoot({ entities: [AccountEntity] })],
			})
				.overrideProvider(ACCOUNT_ENCRYPTION_CONFIG_TOKEN)
				.useValue({ aesKey: encryptionKey })
				.overrideProvider(ACCOUNT_CONFIG_TOKEN)
				.useValue({
					identityManagementStoreEnabled: false,
					identityManagementLoginEnabled: true,
				})
				.compile();
		});

		afterAll(async () => {
			await moduleFeatureEnabled.close();
		});

		it('should use AccountIdmToDtoMapperIdm', () => {
			const mapper = moduleFeatureEnabled.get(AccountIdmToDoMapper);
			expect(mapper).toBeInstanceOf(AccountIdmToDoMapperIdm);
		});
	});

	describe('when FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED is disabled', () => {
		let moduleFeatureDisabled: TestingModule;

		beforeAll(async () => {
			moduleFeatureDisabled = await Test.createTestingModule({
				imports: [AccountModule, MongoMemoryDatabaseModule.forRoot({ entities: [AccountEntity] })],
			})
				.overrideProvider(ACCOUNT_ENCRYPTION_CONFIG_TOKEN)
				.useValue({ aesKey: encryptionKey })
				.overrideProvider(ACCOUNT_CONFIG_TOKEN)
				.useValue({
					identityManagementStoreEnabled: false,
					identityManagementLoginEnabled: false,
				})
				.compile();
		});

		afterAll(async () => {
			await moduleFeatureDisabled.close();
		});

		it('should use AccountIdmToDtoMapperDb', () => {
			const mapper = moduleFeatureDisabled.get(AccountIdmToDoMapper);
			expect(mapper).toBeInstanceOf(AccountIdmToDoMapperDb);
		});
	});
});
