import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserLoginMigrationDO } from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser, JWT } from '@src/modules/authentication/decorator/auth.decorator';
import { UserLoginMigrationMapper } from '../mapper/user-login-migration.mapper';
import { UserLoginMigrationQuery } from '../uc/dto/user-login-migration-query';
import { UserLoginMigrationUc } from '../uc/user-login-migration.uc';
import {
	UserLoginMigrationResponse,
	UserLoginMigrationSearchListResponse,
	UserLoginMigrationSearchParams,
} from './dto';
import { Oauth2AuthorizationParams } from './dto/request/oauth2-authorization.params';

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

	@Post('migrate-to-oauth2')
	@ApiOkResponse({ description: 'The User has been successfully migrated.' })
	@ApiInternalServerErrorResponse({ description: 'The migration of the User was not possible.' })
	async migrateUser(
		@JWT() jwt: string,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() body: Oauth2AuthorizationParams
	): Promise<void> {
		await this.migrationUc.migrateUser(jwt, currentUser.userId, body.systemId, body.redirectUri, body.code, body.error);
	}
}
