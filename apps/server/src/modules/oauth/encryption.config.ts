import { ConfigProperty, Configuration } from '@infra/configuration';
import { EncryptionConfig } from '@infra/encryption';
import { IsString } from 'class-validator';

export const OAUTH_ENCRYPTION_CONFIG_TOKEN = 'OAUTH_ENCRYPTION_CONFIG_TOKEN';

@Configuration()
export class OauthEncryptionConfig implements EncryptionConfig {
	@ConfigProperty('AES_KEY')
	@IsString()
	public aesKey!: string;
}
