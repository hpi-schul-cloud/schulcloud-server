import { ConfigProperty, Configuration, Secret } from '@infra/configuration';
import { EncryptionConfig } from '@infra/encryption';
import { IsString } from 'class-validator';

export const MANAGMENT_ENCRYPTION_CONFIG_TOKEN = 'MANAGMENT_ENCRYPTION_CONFIG_TOKEN';

@Configuration()
export class ManagmentEncryptionConfig implements EncryptionConfig {
	@ConfigProperty('AES_KEY')
	@Secret()
	@IsString()
	public aesKey!: string;
}
