import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@src/modules/authentication';
import { Page } from '@shared/domain/domainobject/page';
import { UserLoginMigrationDO } from '@shared/domain';
import {
	UserLoginMigrationResponse,
	UserLoginMigrationSearchParams,
	UserLoginMigrationSearchListResponse,
} from './dto';
import { MigrationUc } from '../uc/migration.uc';

import { UserLoginMigrationMapper } from '../mapper/user-login-migration.mapper';
import { UserLoginMigrationQuery } from '../uc/dto/user-login-migration-query';

@ApiTags('UserLoginMigration')
@Controller('user-login-migrations')
export class UserLoginMigrationController {
	constructor(private readonly migrationUc: MigrationUc) {}

	@Get()
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
