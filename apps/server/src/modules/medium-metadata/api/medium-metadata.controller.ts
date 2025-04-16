import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	Controller,
	Get,
	InternalServerErrorException,
	NotFoundException,
	Param,
	UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
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

	@Get('medium/:mediumId/media-source/:mediaSourceId/')
	@ApiOperation({ summary: 'Returns configuration metadata for media source of a medium' })
	@ApiResponse({ status: 200, type: MediumMetadataResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
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
