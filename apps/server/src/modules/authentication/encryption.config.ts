import { ConfigProperty, Configuration } from '@infra/configuration';
import { EncryptionConfig } from '@infra/encryption';
import { IsString } from 'class-validator';

export const AUTHENTICATION_ENCRYPTION_CONFIG_TOKEN = 'AUTHENTICATION_ENCRYPTION_CONFIG_TOKEN';

@Configuration()
export class AuthenticationEncryptionConfig implements EncryptionConfig {
	@ConfigProperty('AES_KEY')
	@IsString()
	public aesKey!: string;
}
