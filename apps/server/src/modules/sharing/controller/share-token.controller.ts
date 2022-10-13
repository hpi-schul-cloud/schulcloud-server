import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequestTimeout } from '@shared/common';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser, JWT } from '@src/modules/authentication/decorator/auth.decorator';
import { CopyApiResponse } from '@src/modules/learnroom/controller/dto';
import { CopyMapper } from '@src/modules/learnroom/mapper/copy.mapper';
import serverConfig from '@src/server.config';
import { ShareTokenInfoResponseMapper, ShareTokenResponseMapper } from '../mapper';
import { ShareTokenUC } from '../uc';
import { ShareTokenBodyParams, ShareTokenInfoResponse, ShareTokenResponse, ShareTokenUrlParams } from './dto';

@ApiTags('ShareToken')
@Authenticate('jwt')
@Controller('sharetoken')
export class ShareTokenController {
	constructor(private readonly shareTokenUC: ShareTokenUC) {}

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

	@Get(':token')
	async lookupShareToken(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: ShareTokenUrlParams
	): Promise<ShareTokenInfoResponse> {
		const shareTokenInfo = await this.shareTokenUC.lookupShareToken(currentUser.userId, urlParams.token);

		const response = ShareTokenInfoResponseMapper.mapToResponse(shareTokenInfo);

		return response;
	}

	@Post(':token/import')
	@RequestTimeout(serverConfig().INCOMING_REQUEST_TIMEOUT_COPY_API)
	async importShareToken(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: ShareTokenUrlParams,
		@Body() body: { newName: string },
		@JWT() jwt: string
	): Promise<CopyApiResponse> {
		const copyStatus = await this.shareTokenUC.importShareToken(currentUser.userId, urlParams.token, body.newName, jwt);

		// WIP we have to find a better way to share the mapper
		const response = CopyMapper.mapToResponse(copyStatus);

		return response;
	}
}
