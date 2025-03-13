import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiInternalServerErrorResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { MediumMetadataDto } from '../dto';
import { MediumMetadataMapper } from '../mapper';
import { MediumMetadataUc } from '../uc/medium-metadata.uc';
import { MediumMetadataResponse } from './response/medium-metadata.response';
import { MediumMetadataParams } from './request/medium-metadata.params';

@ApiTags('Medium Metadata')
@JwtAuthentication()
@Controller('medium-metadata')
export class MediumMetadataController {
	constructor(private readonly mediumMetadataUc: MediumMetadataUc) {}

	@Get('medium/:mediumId/media-source/:mediaSourceId/')
	@ApiOperation({ summary: 'Returns configuration metadata for media source of a medium' })
	@ApiUnauthorizedResponse({ description: 'User is not logged in.' })
	@ApiInternalServerErrorResponse({
		description: 'Error occurred while retrieving configuration metadata from media source',
	})
	public async getMediumMetadata(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: MediumMetadataParams
	): Promise<MediumMetadataResponse> {
		const mediumMetadata: MediumMetadataDto = await this.mediumMetadataUc.getMetadata(
			currentUser.userId,
			params.mediumId,
			params.mediaSourceId
		);

		const mapped: MediumMetadataResponse = MediumMetadataMapper.mapToMediaSourceMediumMetadataResponse(mediumMetadata);

		return mapped;
	}
}
