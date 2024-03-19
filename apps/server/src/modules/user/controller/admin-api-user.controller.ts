import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminApiUserUc } from '../uc';
import { AdminApiUserCreateBodyParams } from './dto/admin-api-user-create.body.params';
import { AdminApiUserCreateResponse } from './dto/admin-api-user-create.response.dto';

@ApiTags('AdminApiUsers')
@UseGuards(AuthGuard('api-key'))
@Controller('/admin/users')
export class AdminApiUsersController {
	constructor(private readonly uc: AdminApiUserUc) {}

	@Post('')
	@ApiOperation({
		summary: 'create a user together with an account',
	})
	async createUser(@Body() body: AdminApiUserCreateBodyParams): Promise<AdminApiUserCreateResponse> {
		const result = await this.uc.createUserAndAccount(body);
		const mapped = new AdminApiUserCreateResponse(result);
		return Promise.resolve(mapped);
	}
}
