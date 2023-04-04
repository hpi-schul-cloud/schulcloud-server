import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@src/modules/authentication';

@ApiTags('UserLoginMigration')
@Controller('user-login-migrations')
export class UserLoginMigrationController {
	@Get()
	async getMigrations(@CurrentUser() user: ICurrentUser, @Query() params: unknown): Promise<null> {
		return Promise.resolve(null);
	}
}
