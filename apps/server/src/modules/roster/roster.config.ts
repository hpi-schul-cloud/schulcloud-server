import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const ROSTER_PUBLIC_API_CONFIG_TOKEN = 'ROSTER_PUBLIC_API_CONFIG_TOKEN';

@Configuration()
export class RosterPublicApiConfig {
	@ConfigProperty('FEATURE_COLUMN_BOARD_EXTERNAL_TOOLS_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureColumnBoardExternalToolsEnabled = true;
}
