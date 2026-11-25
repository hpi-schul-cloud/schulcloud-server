import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsUrl } from 'class-validator';

export const LEGACY_FILE_ARCHIVE_CONFIG_TOKEN = 'LEGACY_FILE_ARCHIVE_CONFIG_TOKEN';

@Configuration()
export class LegacyFileArchiveConfig {
	@ConfigProperty('API_HOST')
	@IsUrl({ require_tld: false })
	public legacyBaseUrl!: string;
}
