import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const TEAM_PUBLIC_API_CONFIG_TOKEN = 'TEAM_PUBLIC_API_CONFIG_TOKEN';

@Configuration()
export class TeamPublicApiConfig {
	@ConfigProperty('FEATURE_TEAM_CREATE_ROOM_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureTeamCreateRoomEnabled = false;
}
