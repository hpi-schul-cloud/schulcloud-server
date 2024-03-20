import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { CopyApiResponse, CopyMapper } from '@modules/copy-helper';
import {
	Body,
	Controller,
	ForbiddenException,
	Get,
	InternalServerErrorException,
	NotFoundException,
	NotImplementedException,
	Param,
	Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError, RequestTimeout } from '@shared/common';
import { ShareTokenInfoResponseMapper, ShareTokenResponseMapper } from '../mapper';
import { ShareTokenUC } from '../uc';
import {
	ShareTokenBodyParams,
	ShareTokenImportBodyParams,
	ShareTokenInfoResponse,
	ShareTokenResponse,
	ShareTokenUrlParams,
} from './dto';

@ApiTags('ShareToken')
@Authenticate('jwt')
@Controller('sharetoken')
export class ShareTokenController {
	constructor(private readonly shareTokenUC: ShareTokenUC) {}

	@ApiOperation({ summary: 'Create a share token.' })
	@ApiResponse({ status: 201, type: ShareTokenResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Post()
	async createShareToken(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() body: ShareTokenBodyParams
	): Promise<ShareTokenResponse> {
		const shareToken = await this.shareTokenUC.createShareToken(
			currentUser.userId,
			{
				parentType: body.parentType,
				parentId: body.parentId,
			},
			{
				schoolExclusive: body.schoolExclusive,
				expiresInDays: body.expiresInDays,
			}
		);

		const response = ShareTokenResponseMapper.mapToResponse(shareToken);

		return Promise.resolve(response);
	}

	@ApiOperation({ summary: 'Look up a share token.' })
	@ApiResponse({ status: 200, type: ShareTokenInfoResponse })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Get(':token')
	async lookupShareToken(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: ShareTokenUrlParams
	): Promise<ShareTokenInfoResponse> {
		const shareTokenInfo = await this.shareTokenUC.lookupShareToken(currentUser.userId, urlParams.token);

		const response = ShareTokenInfoResponseMapper.mapToResponse(shareTokenInfo);

		return response;
	}

	@ApiOperation({ summary: 'Import a share token payload.' })
	@ApiResponse({ status: 201, type: CopyApiResponse })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@ApiResponse({ status: 501, type: NotImplementedException })
	@Post(':token/import')
	@RequestTimeout('INCOMING_REQUEST_TIMEOUT_COPY_API')
	async importShareToken(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: ShareTokenUrlParams,
		@Body() body: ShareTokenImportBodyParams
	): Promise<CopyApiResponse> {
		const copyStatus = await this.shareTokenUC.importShareToken(
			currentUser.userId,
			urlParams.token,
			body.newName,
			body.destinationCourseId
		);

		const response = CopyMapper.mapToResponse(copyStatus);

		return response;
	}
}
