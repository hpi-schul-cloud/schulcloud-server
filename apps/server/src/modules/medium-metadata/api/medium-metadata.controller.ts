import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, Param } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiInternalServerErrorResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { MediumMetadataDto } from '../dto';
import { MediumMetadataMapper } from '../mapper';
import { MediumMetadataUc } from '../uc';
import { MediumMetadataParams } from './request/medium-metadata.params';
import { MediumMetadataResponse } from './response';

@ApiTags('Medium Metadata')
@JwtAuthentication()
@Controller('medium-metadata')
export class MediumMetadataController {
	constructor(private readonly mediumMetadataUc: MediumMetadataUc) {}

	@ApiOperation({ summary: 'Returns configuration data of a medium' })
	@ApiOkResponse({
		description: 'The medium metadata',
		type: MediumMetadataResponse,
	})
	@ApiBadRequestResponse()
	@ApiUnauthorizedResponse()
	@ApiNotFoundResponse()
	@ApiInternalServerErrorResponse()
	@ApiUnprocessableEntityResponse()
	@Get('medium/:mediumId/media-source/:mediaSourceId/')
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
