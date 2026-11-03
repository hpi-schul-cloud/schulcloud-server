import { CurrentUser, JwtAuthGuard, XApiKeyGuard, type ICurrentUser } from '@infra/auth-guard';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginUc } from '../uc/login.uc';
import { LoginResponse } from './dto/login.response';
import { AdminApiSupportJwtBodyParams } from './dto/admin-api-support-jwt.body.params';

@ApiTags('Admin API Authentication')
@UseGuards(XApiKeyGuard, JwtAuthGuard)
@ApiBearerAuth()
@Controller('/admin/authentication')
export class AdminApiSupportJwtController {
	constructor(private readonly loginUc: LoginUc) {}

	@Post('support-jwt')
	@ApiOperation({ summary: 'Create a support JWT for a user through the internal Admin API.' })
	public async createSupportJwt(
		@Body() body: AdminApiSupportJwtBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<LoginResponse> {
		const accessToken = await this.loginUc.getSupportLoginData(body.userId, currentUser.userId);
		return new LoginResponse({ accessToken });
	}
}
