import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { LoginDto } from '@modules/authentication';
import { ShdUc } from './shd.uc';

@ApiTags('Shd')
@JwtAuthentication()
@Controller('shd')
export class ShdController {
	constructor(private readonly shdUc: ShdUc) {}

	@ApiOperation({ summary: 'Create a support jwt for a user.' })
	@ApiResponse({ status: 201, type: LoginDto })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	// @ApiBody({ required: true, type: XXX })
	@Post('/supportJwt')
	public async supportJwt(@Body() bodyParams: XXX, @CurrentUser() currentUser: ICurrentUser): Promise<LoginDto> {
		const supportUserId = currentUser.userId;
		const loginDto = await this.shdUc.createSupportJwt(bodyParams, supportUserId);

		return loginDto;
	}
}
