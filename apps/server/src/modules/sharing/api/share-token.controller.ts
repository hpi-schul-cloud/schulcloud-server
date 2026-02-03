import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
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
import { RequestTimeout } from '@shared/common/decorators';
import { ApiValidationError } from '@shared/common/error';
import { ShareTokenInfoResponseMapper, ShareTokenResponseMapper } from '../mapper';
import { SHARING_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY } from '../timeout.config';
import {
	ShareTokenBodyParams,
	ShareTokenImportBodyParams,
	ShareTokenInfoResponse,
	ShareTokenResponse,
	ShareTokenUrlParams,
} from './dto';
import { ImportTokenUC } from './import-token.uc';
import { ShareTokenUC } from './share-token.uc';

@ApiTags('ShareToken')
@JwtAuthentication()
@Controller('sharetoken')
export class ShareTokenController {
	constructor(private readonly shareTokenUC: ShareTokenUC, private readonly importTokenUc: ImportTokenUC) {}

	@ApiOperation({ summary: 'Create a share token.' })
	@ApiResponse({ status: 201, type: ShareTokenResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Post()
	public async createShareToken(
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
	public async lookupShareToken(
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
	@RequestTimeout(SHARING_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY)
	public async importShareToken(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: ShareTokenUrlParams,
		@Body() body: ShareTokenImportBodyParams
	): Promise<CopyApiResponse> {
		const copyStatus = await this.importTokenUc.importShareToken(
			currentUser.userId,
			urlParams.token,
			body.newName,
			body.destinationId
		);

		const response = CopyMapper.mapToResponse(copyStatus);

		return response;
	}
}
