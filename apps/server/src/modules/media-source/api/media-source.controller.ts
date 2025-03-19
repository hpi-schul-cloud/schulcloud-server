import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { MediaSource } from '../do';
import { MediaSourceResponseMapper } from '../mapper';
import { MediaSourceUc } from '../uc';
import { MediaSourceListResponse } from './response';

@ApiTags('Media Source')
@JwtAuthentication()
@Controller('media-sources')
export class MediaSourceController {
	constructor(private readonly mediaSourceUc: MediaSourceUc) {}

	@ApiOperation({ summary: 'Get a list of all media sources' })
	@ApiOkResponse({ description: 'The list of all media sources', type: MediaSourceListResponse })
	@ApiUnauthorizedResponse()
	@Get()
	public async getMediaSourceList(@CurrentUser() currentUser: ICurrentUser): Promise<MediaSourceListResponse> {
		const mediaSources: MediaSource[] = await this.mediaSourceUc.getMediaSourceList(currentUser.userId);

		const response: MediaSourceListResponse = MediaSourceResponseMapper.mapToMediaSourceListResponse(mediaSources);

		return response;
	}
}
