import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ShareTokenMapper } from '../mapper/share-token.mapper';
import { ShareTokenUC } from '../uc';
import { ShareTokenBodyParams, ShareTokenResponse, ShareTokenUrlParams } from './dto';

@ApiTags('ShareToken')
@Authenticate('jwt')
@Controller('sharetoken')
export class ShareTokenController {
	constructor(private readonly shareTokenUC: ShareTokenUC) {}

	@Get(':token')
	async lookupShareToken(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: ShareTokenUrlParams
	): Promise<ShareTokenResponse> {
		const shareToken = await this.shareTokenUC.lookupShareToken(currentUser.userId, urlParams.token);

		const response = ShareTokenMapper.mapToResponse(shareToken);

		return response;
	}

	@Post('')
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

		const response = ShareTokenMapper.mapToResponse(shareToken);

		return Promise.resolve(response);
	}
}
