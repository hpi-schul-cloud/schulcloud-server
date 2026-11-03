import { createMock } from '@golevelup/ts-jest';
import { type ConfigService } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import { ConfigProperty, Configuration } from './configuration.decorator';
import { ConfigurationFactory } from './configuration.factory';
import { SecretRegistry } from './secret-registry';
import { Secret } from './secret.decorator';

@Configuration()
class ClientConfig {
	@ConfigProperty('CLIENT_ID')
	@IsString()
	public clientId!: string;

	@ConfigProperty('CLIENT_SECRET')
	@Secret()
	@IsString()
	public clientSecret!: string;

	@ConfigProperty('API_KEY')
	@Secret()
	@IsOptional()
	@IsString()
	public apiKey?: string;
}

describe('@Secret()', () => {
	const loadConfig = (env: Record<string, string>): ClientConfig => {
		const configService = createMock<ConfigService>({ get: (key: string) => env[key] });

		return new ConfigurationFactory(configService).loadAndValidateConfigs(ClientConfig);
	};

	afterEach(() => {
		SecretRegistry.clear();
	});

	it('should register the values of secret properties when the config is loaded', () => {
		loadConfig({ CLIENT_ID: 'my-client', CLIENT_SECRET: 'super-secret-value' });

		expect([...SecretRegistry.getSecrets()]).toEqual(['super-secret-value']);
	});

	it('should not register values of other properties', () => {
		loadConfig({ CLIENT_ID: 'my-client-id-value', CLIENT_SECRET: 'super-secret-value' });

		expect(SecretRegistry.getSecrets().has('my-client-id-value')).toBe(false);
	});

	it('should skip secret properties without value', () => {
		loadConfig({ CLIENT_ID: 'my-client', CLIENT_SECRET: 'super-secret-value' });

		expect(SecretRegistry.getSecrets().size).toBe(1);
	});
});

describe(SecretRegistry.name, () => {
	afterEach(() => {
		SecretRegistry.clear();
	});

	it('should ignore values that are too short', () => {
		SecretRegistry.register('short');

		expect(SecretRegistry.getSecrets().size).toBe(0);
	});

	it('should ignore values that are not strings', () => {
		SecretRegistry.register(12345678901);

		expect(SecretRegistry.getSecrets().size).toBe(0);
	});

	it('should change the version only when a new secret is added', () => {
		SecretRegistry.register('super-secret-value');
		const version = SecretRegistry.getVersion();

		SecretRegistry.register('super-secret-value');

		expect(SecretRegistry.getVersion()).toBe(version);
	});
});
