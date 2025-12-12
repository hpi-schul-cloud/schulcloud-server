import { RuntimeConfigService } from '@infra/runtime-config';
import { BOARD_CONTEXT_PUBLIC_API_CONFIG, BoardContextPublicApiConfig } from '@modules/board-context';
import { VIDEO_CONFERENCE_PUBLIC_API_CONFIG, VideoConferencePublicApiConfig } from '@modules/video-conference';
import { Inject, Injectable } from '@nestjs/common';
import { SERVER_CONFIG_TOKEN, ServerConfig } from '../server.config';
import { ConfigResponse } from './dto';
import { ConfigResponseMapper } from './mapper';

@Injectable()
export class ServerUc {
	constructor(
		@Inject(SERVER_CONFIG_TOKEN) private readonly config: ServerConfig,
		@Inject(BOARD_CONTEXT_PUBLIC_API_CONFIG) private readonly boardConfig: BoardContextPublicApiConfig,
		@Inject(VIDEO_CONFERENCE_PUBLIC_API_CONFIG) private readonly videoConferenceConfig: VideoConferencePublicApiConfig,
		private readonly runtimeConfigService: RuntimeConfigService
	) {}

	public async getConfig(): Promise<ConfigResponse> {
		const configDto = ConfigResponseMapper.mapToResponse({
			...this.config,
			...this.boardConfig,
			...this.videoConferenceConfig,
			// TODO: performance issue: multiple calls to runtime config service
			FEATURE_COLUMN_BOARD_SOCKET_ENABLED: await this.runtimeConfigService.getBoolean(
				'FEATURE_COLUMN_BOARD_SOCKET_ENABLED'
			),
		});

		return configDto;
	}
}
