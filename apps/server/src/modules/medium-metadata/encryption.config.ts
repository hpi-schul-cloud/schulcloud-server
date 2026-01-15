import { ConfigProperty, Configuration } from '@infra/configuration';
import { EncryptionConfig } from '@infra/encryption';
import { IsString } from 'class-validator';

export const MEDIUM_METADATA_ENCRYPTION_CONFIG_TOKEN = 'MEDIUM_METADATA_ENCRYPTION_CONFIG_TOKEN';

@Configuration()
export class MediumMetadataEncryptionConfig implements EncryptionConfig {
	@ConfigProperty('AES_KEY')
	@IsString()
	public aesKey!: string;
}
