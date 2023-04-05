import { Controller, Get, Query } from '@nestjs/common';
import { ApiForbiddenResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserLoginMigrationDO } from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { UserLoginMigrationMapper } from '../mapper/user-login-migration.mapper';
import { UserLoginMigrationQuery } from '../uc/dto/user-login-migration-query';
import { UserLoginMigrationUc } from '../uc/user-login-migration.uc';
import {
	UserLoginMigrationResponse,
	UserLoginMigrationSearchListResponse,
	UserLoginMigrationSearchParams,
} from './dto';

@ApiTags('UserLoginMigration')
@Controller('user-login-migrations')
@Authenticate('jwt')
export class UserLoginMigrationController {
	constructor(private readonly migrationUc: UserLoginMigrationUc) {}

	@Get()
	@ApiForbiddenResponse()
	@ApiOkResponse({ description: 'UserLoginMigrations has been found.', type: UserLoginMigrationSearchListResponse })
	async getMigrations(
		@CurrentUser() user: ICurrentUser,
		@Query() params: UserLoginMigrationSearchParams
		// TODO: N21-822 add pagination and sorting
	): Promise<UserLoginMigrationSearchListResponse> {
		const userLoginMigrationQuery: UserLoginMigrationQuery = UserLoginMigrationMapper.mapSearchParamsToQuery(params);

		const migrationPage: Page<UserLoginMigrationDO> = await this.migrationUc.getMigrations(
			user.userId,
			userLoginMigrationQuery,
			{}
		);

		const migrationResponses: UserLoginMigrationResponse[] = migrationPage.data.map(
			(userLoginMigration: UserLoginMigrationDO) =>
				UserLoginMigrationMapper.mapUserLoginMigrationDoToResponse(userLoginMigration)
		);

		const response: UserLoginMigrationSearchListResponse = new UserLoginMigrationSearchListResponse(
			migrationResponses,
			migrationPage.total,
			undefined,
			undefined
		);

		return response;
	}
}
