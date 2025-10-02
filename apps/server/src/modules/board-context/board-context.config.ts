import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const BOARD_CONTEXT_PUBLIC_API_CONFIG = 'BOARD_CONTEXT_PUBLIC_API_CONFIG';

@Configuration()
export class BoardContextPublicApiConfig {
	@IsBoolean()
	@StringToBoolean()
	@ConfigProperty()
	public FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED = false;
}
