import { ConfigProperty, Configuration } from '@infra/configuration';
import { EncryptionConfig } from '@infra/encryption';
import { IsString } from 'class-validator';

export const SYSTEM_ENCRYPTION_CONFIG_TOKEN = 'SYSTEM_ENCRYPTION_CONFIG_TOKEN';

@Configuration()
export class SystemEncryptionConfig implements EncryptionConfig {
	@ConfigProperty('AES_KEY')
	@IsString()
	public aesKey!: string;
}
