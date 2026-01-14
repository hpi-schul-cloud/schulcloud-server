import { ConfigProperty, Configuration } from '@infra/configuration';
import { EncryptionConfig as InternalEncryptionConfig } from '@infra/encryption';
import { IsString } from 'class-validator';

@Configuration()
export class EncryptionConfig implements InternalEncryptionConfig {
	@ConfigProperty('AES_KEY')
	@IsString()
	public aesKey!: string;
}
