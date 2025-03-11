import { XApiKeyAuthentication } from '@infra/auth-guard';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminApiUserUc } from './admin-api-user.uc';
import { AdminApiUserCreateBodyParams } from './dto/admin-api-user-create.body.params';
import { AdminApiUserCreateResponse } from './dto/admin-api-user-create.response.dto';

@ApiTags('AdminApiUsers')
@XApiKeyAuthentication()
@Controller('/admin/users')
export class AdminApiUsersController {
	constructor(private readonly uc: AdminApiUserUc) {}

	@Post('')
	@ApiOperation({
		summary: 'create a user together with an account',
	})
	public async createUser(@Body() body: AdminApiUserCreateBodyParams): Promise<AdminApiUserCreateResponse> {
		const result = await this.uc.createUserAndAccount(body);
		const mapped = new AdminApiUserCreateResponse(result);
		return Promise.resolve(mapped);
	}
}
