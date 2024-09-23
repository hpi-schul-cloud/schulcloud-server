import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { TargetUserIdParams } from './dtos/target-user-id.params';
import { ShdUc } from './shd.uc';

@ApiTags('Shd')
@JwtAuthentication()
@Controller('shd')
export class ShdController {
	constructor(private readonly shdUc: ShdUc) {}

	@ApiOperation({ summary: 'Create a support jwt for a user.' })
	@ApiResponse({ status: 201, type: String })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiBody({ required: true, type: TargetUserIdParams })
	@Post('/supportJwt')
	public async supportJwt(@Body() bodyParams: TargetUserIdParams, @CurrentUser() currentUser: ICurrentUser) {
		const supportUserId = currentUser.userId;
		const loginDto = await this.shdUc.createSupportJwt(bodyParams, supportUserId);

		return loginDto;
	}
}
