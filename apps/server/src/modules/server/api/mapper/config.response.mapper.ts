import { BoardContextPublicApiConfig } from '@modules/board-context';
import { VideoConferencePublicApiConfig } from '@modules/video-conference';
import { ServerConfig } from '../../server.config';
import { ConfigResponse } from '../dto';

export class ConfigResponseMapper {
	public static mapToResponse(
		config: ServerConfig & VideoConferencePublicApiConfig & BoardContextPublicApiConfig
	): ConfigResponse {
		const configResponse = new ConfigResponse(config);

		return configResponse;
	}
}
