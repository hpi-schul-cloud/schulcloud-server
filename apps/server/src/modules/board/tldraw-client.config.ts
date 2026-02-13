import { ConfigProperty, Configuration } from '@infra/configuration';
import { InternalTldrawClientConfig } from '@infra/tldraw-client';
import { IsString, IsUrl } from 'class-validator';

export const TLDRAW_CLIENT_CONFIG_TOKEN = 'TLDRAW_CLIENT_CONFIG_TOKEN';

@Configuration()
export class TldrawClientConfig implements InternalTldrawClientConfig {
	@ConfigProperty('TLDRAW_ADMIN_API_CLIENT__BASE_URL')
	@IsUrl({ require_tld: false })
	public tldrawAdminApiClientBaseUrl!: string;

	@ConfigProperty('TLDRAW_ADMIN_API_CLIENT__API_KEY')
	@IsString()
	public tldrawAdminApiClientApiKey!: string;
}
