import { AlertPublicApiConfig } from '@modules/alert';
import { BoardPublicApiConfig } from '@modules/board';
import { BoardContextPublicApiConfig } from '@modules/board-context';
import { OauthPublicApiConfig } from '@modules/oauth';
import { ProvisioningPublicApiConfig } from '@modules/provisioning';
import { VideoConferencePublicApiConfig } from '@modules/video-conference';
import { ServerConfig } from '../../server.config';
import { ConfigResponse } from '../dto';

export class ConfigResponseMapper {
	public static mapToResponse(
		serverConfig: ServerConfig,
		videoConferenceConfig: VideoConferencePublicApiConfig,
		boardContextConfig: BoardContextPublicApiConfig,
		alertConfig: AlertPublicApiConfig,
		oauthConfig: OauthPublicApiConfig,
		boardConfig: BoardPublicApiConfig,
		provisioningConfig: ProvisioningPublicApiConfig
	): ConfigResponse {
		const configResponse = new ConfigResponse({
			...serverConfig,
			...videoConferenceConfig,
			...boardContextConfig,
			...alertConfig,
			...oauthConfig,
			...boardConfig,
			...provisioningConfig,
		});

		return configResponse;
	}
}
