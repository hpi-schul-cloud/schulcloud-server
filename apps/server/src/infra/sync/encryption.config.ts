import { ConfigProperty, Configuration } from '@infra/configuration';
import { EncryptionConfig } from '@infra/encryption';
import { IsString } from 'class-validator';

export const SYNC_ENCRYPTION_CONFIG_TOKEN = 'SYNC_ENCRYPTION_CONFIG_TOKEN';

@Configuration()
export class SyncEncryptionConfig implements EncryptionConfig {
	@ConfigProperty('AES_KEY')
	@IsString()
	public aesKey!: string;
}
