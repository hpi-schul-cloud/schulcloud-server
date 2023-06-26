import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserLoginMigrationDO } from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser, JWT } from '@src/modules/authentication/decorator/auth.decorator';
import { UserLoginMigrationMapper } from '../mapper';
import { UserLoginMigrationQuery } from '../uc';
import { UserLoginMigrationUc } from '../uc/user-login-migration.uc';
import {
	UserLoginMigrationResponse,
	UserLoginMigrationSearchListResponse,
	UserLoginMigrationSearchParams,
} from './dto';
import { Oauth2MigrationParams } from './dto/oauth2-migration.params';
import { StartUserLoginMigrationUc } from '../uc/start-user-login-migration.uc';
import { UserLoginMigrationLoggableException } from '../error';
import { RestartUserLoginMigrationUc } from '../uc/restart-user-login-migration.uc';

@ApiTags('UserLoginMigration')
@Controller('user-login-migrations')
@Authenticate('jwt')
export class UserLoginMigrationController {
	constructor(
		private readonly userLoginMigrationUc: UserLoginMigrationUc,
		private readonly startUserLoginMigrationUc: StartUserLoginMigrationUc,
		private readonly restartUserLoginMigrationUc: RestartUserLoginMigrationUc
	) {}

	@Get()
	@ApiForbiddenResponse()
	@ApiOkResponse({ description: 'UserLoginMigrations has been found.', type: UserLoginMigrationSearchListResponse })
	@ApiInternalServerErrorResponse({ description: 'Cannot find Sanis system information.' })
	async getMigrations(
		@CurrentUser() user: ICurrentUser,
		@Query() params: UserLoginMigrationSearchParams
	): Promise<UserLoginMigrationSearchListResponse> {
		const userLoginMigrationQuery: UserLoginMigrationQuery = UserLoginMigrationMapper.mapSearchParamsToQuery(params);

		const migrationPage: Page<UserLoginMigrationDO> = await this.userLoginMigrationUc.getMigrations(
			user.userId,
			userLoginMigrationQuery
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

	@Post('start')
	@ApiBadRequestResponse({
		description: 'Preconditions for starting user login migration are not met',
		type: UserLoginMigrationLoggableException,
	})
	@ApiOkResponse({ description: 'User login migration started', type: UserLoginMigrationResponse })
	@ApiForbiddenResponse()
	async startMigration(@CurrentUser() currentUser: ICurrentUser): Promise<UserLoginMigrationResponse> {
		const migrationDto: UserLoginMigrationDO = await this.startUserLoginMigrationUc.startMigration(
			currentUser.userId,
			currentUser.schoolId
		);

		const migrationResponse: UserLoginMigrationResponse =
			UserLoginMigrationMapper.mapUserLoginMigrationDoToResponse(migrationDto);

		return migrationResponse;
	}

	@Put('restart')
	@ApiBadRequestResponse({
		description: 'Preconditions for starting user login migration are not met',
		type: UserLoginMigrationLoggableException,
	})
	@ApiOkResponse({ description: 'User login migration started', type: UserLoginMigrationResponse })
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	async restartMigration(@CurrentUser() currentUser: ICurrentUser): Promise<UserLoginMigrationResponse> {
		const migrationDto: UserLoginMigrationDO = await this.restartUserLoginMigrationUc.restartMigration(
			currentUser.userId,
			currentUser.schoolId
		);

		const migrationResponse: UserLoginMigrationResponse =
			UserLoginMigrationMapper.mapUserLoginMigrationDoToResponse(migrationDto);

		return migrationResponse;
	}

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
