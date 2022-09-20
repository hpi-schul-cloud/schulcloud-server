import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ShareTokenMapper } from '../mapper/share-token.mapper';
import { ShareTokenUC } from '../uc';
import { ShareTokenResponse, ShareTokenUrlParams } from './dto';

@ApiTags('ShareToken')
@Authenticate('jwt')
@Controller('sharetoken')
export class ShareTokenController {
	constructor(private readonly shareTokenUC: ShareTokenUC) {}

	@Get(':token')
	async lookupShareToken(
		@Param() urlParams: ShareTokenUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ShareTokenResponse> {
		const shareToken = await this.shareTokenUC.lookupShareToken(currentUser.userId, urlParams.token);

		const response = ShareTokenMapper.mapToResponse(shareToken);

		return response;
	}
}
