import { ConfigProperty, Configuration } from '@infra/configuration';
import { EncryptionConfig } from '@infra/encryption';
import { IsString } from 'class-validator';

export const SCHOOL_LICENSE_ENCRYPTION_CONFIG_TOKEN = 'SCHOOL_LICENSE_ENCRYPTION_CONFIG_TOKEN';

@Configuration()
export class SchoolLicenseEncryptionConfig implements EncryptionConfig {
	@ConfigProperty('AES_KEY')
	@IsString()
	public aesKey!: string;
}
