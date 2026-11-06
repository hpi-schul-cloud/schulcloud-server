import { ConfigurationModule, SecretRegistry } from '@infra/configuration';
import { Test, type TestingModule } from '@nestjs/testing';
import { SYNC_ENCRYPTION_CONFIG_TOKEN, SyncEncryptionConfig } from './encryption.config';

describe(SyncEncryptionConfig.name, () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ConfigurationModule.register(SYNC_ENCRYPTION_CONFIG_TOKEN, SyncEncryptionConfig)],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should register the AES key as secret, so it is masked in logs', () => {
		const config = module.get<SyncEncryptionConfig>(SYNC_ENCRYPTION_CONFIG_TOKEN);

		expect(SecretRegistry.getSecrets().has(config.aesKey)).toBe(true);
	});
});
