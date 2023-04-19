import { Body, Controller, Post } from '@nestjs/common';
import { ApiInternalServerErrorResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Authenticate, CurrentUser, JWT } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@src/modules/authentication';
import { UserLoginMigrationUc } from '../uc/user-login-migration.uc';
import { Oauth2MigrationParams } from './dto/oauth2-migration.params';

@ApiTags('UserLoginMigration')
@Controller('user-login-migrations')
@Authenticate('jwt')
export class UserLoginMigrationController {
	constructor(private readonly userLoginMigrationUc: UserLoginMigrationUc) {}

	@Post('migrate-to-oauth2')
	@ApiOkResponse({ description: 'The User has been successfully migrated.', status: 200 })
	@ApiInternalServerErrorResponse({ description: 'The migration of the User was not possible.' })
	async migrateUserLogin(
		@JWT() jwt: string,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() body: Oauth2MigrationParams
	): Promise<void> {
		await this.userLoginMigrationUc.migrate(jwt, currentUser.userId, body.systemId, body.code, body.redirectUri);
	}
}
