import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsString, IsUrl } from 'class-validator';

export interface InternalDeletionConsoleConfig {
	adminApiClientBaseUrl: string;
	adminApiClientApiKey: string;
}

export const DELETION_CONSOLE_CONFIG_TOKEN = 'DELETION_CONSOLE_CONFIG_TOKEN';

@Configuration()
export class DeletionConsoleConfig implements InternalDeletionConsoleConfig {
	@ConfigProperty('ADMIN_API_CLIENT__BASE_URL')
	@IsUrl()
	public adminApiClientBaseUrl!: string;

	@ConfigProperty('ADMIN_API_CLIENT__API_KEY')
	@IsString()
	public adminApiClientApiKey!: string;
}
