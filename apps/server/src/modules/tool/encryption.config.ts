import { ConfigProperty, Configuration } from '@infra/configuration';
import { EncryptionConfig } from '@infra/encryption';
import { IsString } from 'class-validator';

export const TOOL_ENCRYPTION_CONFIG_TOKEN = 'TOOL_ENCRYPTION_CONFIG_TOKEN';

@Configuration()
export class ToolEncryptionConfig implements EncryptionConfig {
	@ConfigProperty('AES_KEY')
	@IsString()
	public aesKey!: string;
}
