import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import {
	ApiForbiddenResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { UserLoginMigrationRollbackUc } from '../uc';
import { UserIdParams } from './dto';

@ApiTags('UserLoginMigration Rollback')
@Controller('user-login-migrations')
@Authenticate('jwt')
export class UserLoginMigrationRollbackController {
	constructor(private readonly userLoginMigrationRollbackUc: UserLoginMigrationRollbackUc) {}

	@Post('/users/:userId/rollback-migration')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Rollback a user from a user login migration' })
	@ApiForbiddenResponse({ description: 'User is not allowed to access this resource' })
	@ApiUnauthorizedResponse({ description: 'User is not logged in' })
	@ApiNoContentResponse({ description: 'The user has been successfully rolled back' })
	@ApiNotFoundResponse({ description: "The user's school has no migration" })
	@ApiUnprocessableEntityResponse({ description: 'The user has not migrated yet' })
	public async migrateUserLogin(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() userIdParams: UserIdParams
	): Promise<void> {
		await this.userLoginMigrationRollbackUc.rollbackUser(currentUser.userId, userIdParams.userId);
	}
}
