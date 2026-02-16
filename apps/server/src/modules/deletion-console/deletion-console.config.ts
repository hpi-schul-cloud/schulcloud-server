import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsString, IsUrl } from 'class-validator';

export const DELETION_CONSOLE_CONFIG_TOKEN = 'DELETION_CONSOLE_CONFIG_TOKEN';

@Configuration()
export class DeletionConsoleConfig {
	@ConfigProperty('ADMIN_API_CLIENT__BASE_URL')
	@IsUrl({ require_tld: false })
	public adminApiClientBaseUrl!: string;

	@ConfigProperty('ADMIN_API_CLIENT__API_KEY')
	@IsString()
	public adminApiClientApiKey!: string;
}
