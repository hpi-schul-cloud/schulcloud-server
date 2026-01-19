import { ALERT_PUBLIC_API_CONFIG, AlertPublicApiConfig } from '@modules/alert';
import { BOARD_PUBLIC_API_CONFIG_TOKEN, BoardPublicApiConfig } from '@modules/board';
import { BOARD_CONTEXT_PUBLIC_API_CONFIG, BoardContextPublicApiConfig } from '@modules/board-context';
import { OAUTH_PUBLIC_API_CONFIG_TOKEN, OauthPublicApiConfig } from '@modules/oauth';
import { PROVISIONING_PUBLIC_API_CONFIG, ProvisioningPublicApiConfig } from '@modules/provisioning';
import { REGISTRATION_PUBLIC_API_CONFIG_TOKEN, RegistrationPublicApiConfig } from '@modules/registration';
import { VIDEO_CONFERENCE_PUBLIC_API_CONFIG, VideoConferencePublicApiConfig } from '@modules/video-conference';
import { Inject, Injectable } from '@nestjs/common';
import { SERVER_CONFIG_TOKEN, ServerConfig } from '../server.config';
import { ConfigResponse } from './dto';
import { ConfigResponseMapper } from './mapper';

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
		@Inject(REGISTRATION_PUBLIC_API_CONFIG_TOKEN) private readonly registrationConfig: RegistrationPublicApiConfig
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
			this.registrationConfig
		);

		return configDto;
	}
}
