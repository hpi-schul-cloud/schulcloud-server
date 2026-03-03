import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const LEGACY_FILE_ARCHIVE_CONFIG_TOKEN = 'LEGACY_FILE_ARCHIVE_CONFIG_TOKEN';

@Configuration()
export class LegacyFileArchiveConfig {
	@ConfigProperty('FEATURE_TEAM_ARCHIVE_DOWNLOAD')
	@IsBoolean()
	@StringToBoolean()
	public featureTeamArchiveDownload = true;
}
