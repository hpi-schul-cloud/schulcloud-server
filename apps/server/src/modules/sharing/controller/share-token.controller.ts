import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ShareTokenInfoResponseMapper, ShareTokenResponseMapper } from '../mapper';
import { ShareTokenUC } from '../uc';
import { ShareTokenBodyParams, ShareTokenInfoResponse, ShareTokenResponse, ShareTokenUrlParams } from './dto';

@ApiTags('ShareToken')
@Authenticate('jwt')
@Controller('sharetoken')
export class ShareTokenController {
	constructor(private readonly shareTokenUC: ShareTokenUC) {}

	@Get(':token')
	async lookupShareToken(
		@Param() urlParams: ShareTokenUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ShareTokenInfoResponse> {
		const shareTokenInfo = await this.shareTokenUC.lookupShareToken(currentUser.userId, urlParams.token);

		const response = ShareTokenInfoResponseMapper.mapToResponse(shareTokenInfo);

		return response;
	}

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
}
