import { SyncEncryptionConfig } from './encryption.config';

// No other test loads this config, so without this one its lines count as uncovered in SonarCloud.
// Secret masking itself is tested in infra/configuration (secret.spec.ts).
describe(SyncEncryptionConfig.name, () => {
	it('should be created without a default AES key', () => {
		const config = new SyncEncryptionConfig();

		expect(config.aesKey).toBeUndefined();
	});
});
