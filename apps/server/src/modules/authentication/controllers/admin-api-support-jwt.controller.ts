import { XApiKeyAuthentication } from '@infra/auth-guard';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginUc } from '../uc/login.uc';
import { LoginResponse } from './dto/login.response';
import { AdminApiSupportJwtBodyParams } from './dto/admin-api-support-jwt.body.params';

@ApiTags('Admin API Authentication')
@XApiKeyAuthentication()
@Controller('/admin/authentication')
export class AdminApiSupportJwtController {
	constructor(private readonly loginUc: LoginUc) {}

	@Post('support-jwt')
	@ApiOperation({ summary: 'Create a support JWT for a user through the internal Admin API.' })
	public async createSupportJwt(@Body() body: AdminApiSupportJwtBodyParams): Promise<LoginResponse> {
		const accessToken = await this.loginUc.getSupportLoginData(body.userId, body.supportUserId);
		return new LoginResponse({ accessToken });
	}
}
