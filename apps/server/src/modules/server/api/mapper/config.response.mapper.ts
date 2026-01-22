import { AlertPublicApiConfig } from '@modules/alert';
import { BoardPublicApiConfig } from '@modules/board';
import { BoardContextPublicApiConfig } from '@modules/board-context';
import { CommonCartridgePublicApiConfig } from '@modules/common-cartridge';
import { OauthPublicApiConfig } from '@modules/oauth';
import { ProvisioningPublicApiConfig } from '@modules/provisioning';
import { RegistrationPublicApiConfig } from '@modules/registration';
import { RoomPublicApiConfig } from '@modules/room';
import { RosterPublicApiConfig } from '@modules/roster';
import { SharingPublicApiConfig } from '@modules/sharing';
import { VideoConferencePublicApiConfig } from '@modules/video-conference';
import { ServerConfig } from '../../server.config';
import { ConfigResponse } from '../dto';
import { TaskPublicApiConfig } from '@modules/task';

export class ConfigResponseMapper {
	public static mapToResponse(
		serverConfig: ServerConfig,
		videoConferenceConfig: VideoConferencePublicApiConfig,
		boardContextConfig: BoardContextPublicApiConfig,
		alertConfig: AlertPublicApiConfig,
		oauthConfig: OauthPublicApiConfig,
		boardConfig: BoardPublicApiConfig,
		provisioningConfig: ProvisioningPublicApiConfig,
		registrationConfig: RegistrationPublicApiConfig,
		rosterConfig: RosterPublicApiConfig,
		roomConfig: RoomPublicApiConfig,
		sharingConfig: SharingPublicApiConfig,
		commonCartridgeConfig: CommonCartridgePublicApiConfig,
		taskConfig: TaskPublicApiConfig
	): ConfigResponse {
		const configResponse = new ConfigResponse({
			...serverConfig,
			...videoConferenceConfig,
			...boardContextConfig,
			...alertConfig,
			...oauthConfig,
			...boardConfig,
			...provisioningConfig,
			...registrationConfig,
			...rosterConfig,
			...roomConfig,
			...sharingConfig,
			...commonCartridgeConfig,
			...taskConfig,
		});

		return configResponse;
	}
}
