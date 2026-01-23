import { ALERT_PUBLIC_API_CONFIG, AlertPublicApiConfig } from '@modules/alert';
import { BOARD_PUBLIC_API_CONFIG_TOKEN, BoardPublicApiConfig } from '@modules/board';
import { BOARD_CONTEXT_PUBLIC_API_CONFIG, BoardContextPublicApiConfig } from '@modules/board-context';
import { COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN, CommonCartridgePublicApiConfig } from '@modules/common-cartridge';
import { OAUTH_PUBLIC_API_CONFIG_TOKEN, OauthPublicApiConfig } from '@modules/oauth';
import { PROVISIONING_PUBLIC_API_CONFIG, ProvisioningPublicApiConfig } from '@modules/provisioning';
import { REGISTRATION_PUBLIC_API_CONFIG_TOKEN, RegistrationPublicApiConfig } from '@modules/registration';
import { ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig } from '@modules/room';
import { ROSTER_PUBLIC_API_CONFIG_TOKEN, RosterPublicApiConfig } from '@modules/roster';
import { SHARING_PUBLIC_API_CONFIG_TOKEN, SharingPublicApiConfig } from '@modules/sharing';
import { TASK_PUBLIC_API_CONFIG_TOKEN, TaskPublicApiConfig } from '@modules/task';
import { VIDEO_CONFERENCE_PUBLIC_API_CONFIG, VideoConferencePublicApiConfig } from '@modules/video-conference';
import { Inject, Injectable } from '@nestjs/common';
import { SERVER_CONFIG_TOKEN, ServerConfig } from '../server.config';
import { ConfigResponse } from './dto';
import { ConfigResponseMapper } from './mapper';
import { TOOL_PUBLIC_API_CONFIG_TOKEN, ToolPublicApiConfig } from '@modules/tool';

@Injectable()
export class ServerUc {
	constructor(
		@Inject(SERVER_CONFIG_TOKEN) private readonly config: ServerConfig,
		@Inject(BOARD_CONTEXT_PUBLIC_API_CONFIG) private readonly boardContextConfig: BoardContextPublicApiConfig,
		@Inject(VIDEO_CONFERENCE_PUBLIC_API_CONFIG) private readonly videoConferenceConfig: VideoConferencePublicApiConfig,
		@Inject(ALERT_PUBLIC_API_CONFIG) private readonly alertConfig: AlertPublicApiConfig,
		@Inject(OAUTH_PUBLIC_API_CONFIG_TOKEN) private readonly oauthConfig: OauthPublicApiConfig,
		@Inject(BOARD_PUBLIC_API_CONFIG_TOKEN) private readonly boardConfig: BoardPublicApiConfig,
		@Inject(PROVISIONING_PUBLIC_API_CONFIG) private readonly provisioningConfig: ProvisioningPublicApiConfig,
		@Inject(REGISTRATION_PUBLIC_API_CONFIG_TOKEN) private readonly registrationConfig: RegistrationPublicApiConfig,
		@Inject(ROSTER_PUBLIC_API_CONFIG_TOKEN) private readonly rosterConfig: RosterPublicApiConfig,
		@Inject(ROOM_PUBLIC_API_CONFIG_TOKEN) private readonly roomConfig: RoomPublicApiConfig,
		@Inject(SHARING_PUBLIC_API_CONFIG_TOKEN) private readonly sharingConfig: SharingPublicApiConfig,
		@Inject(COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN)
		private readonly commonCartridgeConfig: CommonCartridgePublicApiConfig,
		@Inject(TOOL_PUBLIC_API_CONFIG_TOKEN) private readonly toolConfig: ToolPublicApiConfig,
		@Inject(TASK_PUBLIC_API_CONFIG_TOKEN) private readonly taskConfig: TaskPublicApiConfig
	) {}

	public getConfig(): ConfigResponse {
		const configDto = ConfigResponseMapper.mapToResponse(
			this.config,
			this.videoConferenceConfig,
			this.boardContextConfig,
			this.alertConfig,
			this.oauthConfig,
			this.boardConfig,
			this.provisioningConfig,
			this.registrationConfig,
			this.rosterConfig,
			this.roomConfig,
			this.sharingConfig,
			this.commonCartridgeConfig,
			this.toolConfig,
			this.taskConfig
		);

		return configDto;
	}
}
