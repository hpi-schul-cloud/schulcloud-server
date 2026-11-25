import { ConfigProperty, Configuration, Secret } from '@infra/configuration';
import { EncryptionConfig } from '@infra/encryption';
import { IsString } from 'class-validator';

export const MEDIA_SOURCE_SYNC_ENCRYPTION_CONFIG_TOKEN = 'MEDIA_SOURCE_SYNC_ENCRYPTION_CONFIG_TOKEN';

@Configuration()
export class MediaSourceSyncEncryptionConfig implements EncryptionConfig {
	@ConfigProperty('AES_KEY')
	@Secret()
	@IsString()
	public aesKey!: string;
}
