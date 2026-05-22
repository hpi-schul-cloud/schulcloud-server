import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, ForbiddenException, Post, UnauthorizedException } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { TargetUserIdParams } from './dto/target-user-id.params';
import { ShdUc } from './shd.uc';
import { LoginResponseMapper } from './mapper/login-response.mapper';
import { LoginResponse } from './dto';

@ApiTags('Shd')
@JwtAuthentication()
@Controller('shd')
export class ShdController {
	constructor(private readonly shdUc: ShdUc) {}

	@ApiOperation({ summary: 'Create a support jwt for a user.' })
	@ApiResponse({ status: 201, type: LoginResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiBody({ required: true, type: TargetUserIdParams })
	@Post('/supportJwt')
	public async supportJwt(
		@Body() bodyParams: TargetUserIdParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<LoginResponse> {
		const supportUserId = currentUser.userId;
		const accessToken = await this.shdUc.createSupportJwt(bodyParams, supportUserId);
		const loginResponse = LoginResponseMapper.mapToLoginResponse(accessToken);

		return loginResponse;
	}
}
