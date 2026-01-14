import { ConfigProperty, Configuration } from '@infra/configuration';
import { EncryptionConfig } from '@infra/encryption';
import { IsString } from 'class-validator';

export const ACCOUNT_ENCRYPTION_CONFIG_TOKEN = 'ACCOUNT_ENCRYPTION_CONFIG_TOKEN';

@Configuration()
export class AccountEncryptionConfig implements EncryptionConfig {
	@ConfigProperty('AES_KEY')
	@IsString()
	public aesKey!: string;
}
