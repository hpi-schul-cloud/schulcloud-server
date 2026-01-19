import { AlertPublicApiConfig } from '@modules/alert';
import { BoardContextPublicApiConfig } from '@modules/board-context';
import { OauthPublicApiConfig } from '@modules/oauth';
import { ProvisioningPublicApiConfig } from '@modules/provisioning';
import { VideoConferencePublicApiConfig } from '@modules/video-conference';
import { ServerConfig } from '../../server.config';
import { ConfigResponse } from '../dto';
import { RegistrationPublicApiConfig } from '@modules/registration';

export class ConfigResponseMapper {
	public static mapToResponse(
		serverConfig: ServerConfig,
		videoConferenceConfig: VideoConferencePublicApiConfig,
		boardContextConfig: BoardContextPublicApiConfig,
		alertConfig: AlertPublicApiConfig,
		oauthConfig: OauthPublicApiConfig,
		provisioningPublicApiConfig: ProvisioningPublicApiConfig,
		registrationPublicApiConfig: RegistrationPublicApiConfig
	): ConfigResponse {
		const configResponse = new ConfigResponse({
			...serverConfig,
			...videoConferenceConfig,
			...boardContextConfig,
			...alertConfig,
			...oauthConfig,
			...provisioningPublicApiConfig,
			...registrationPublicApiConfig,
		});

		return configResponse;
	}
}
