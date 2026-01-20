import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const ROOM_PUBLIC_API_CONFIG_TOKEN = 'ROOM_PUBLIC_API_CONFIG_TOKEN';

@Configuration()
export class RoomPublicApiConfig {
	@ConfigProperty('FEATURE_ADMINISTRATE_ROOMS_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureAdministrateRoomsEnabled = false;

	@ConfigProperty('FEATURE_ROOM_COPY_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureRoomCopyEnabled = true;

	@ConfigProperty('FEATURE_ROOM_LINK_INVITATION_EXTERNAL_PERSONS_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureRoomLinkInvitationExternalPersonsEnabled = false;
}
