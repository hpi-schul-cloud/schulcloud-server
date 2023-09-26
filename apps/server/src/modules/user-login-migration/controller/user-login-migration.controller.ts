import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Page, UserLoginMigrationDO } from '@shared/domain';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser, JWT } from '@src/modules/authentication/decorator/auth.decorator';
import {
	SchoolNumberMissingLoggableException,
	UserLoginMigrationAlreadyClosedLoggableException,
	UserLoginMigrationGracePeriodExpiredLoggableException,
	UserLoginMigrationNotFoundLoggableException,
} from '../error';
import { UserLoginMigrationMapper } from '../mapper';
import {
	CloseUserLoginMigrationUc,
	RestartUserLoginMigrationUc,
	StartUserLoginMigrationUc,
	ToggleUserLoginMigrationUc,
	UserLoginMigrationQuery,
	UserLoginMigrationUc,
} from '../uc';
import {
	UserLoginMigrationResponse,
	UserLoginMigrationSearchListResponse,
	UserLoginMigrationSearchParams,
} from './dto';
import { Oauth2MigrationParams } from './dto/oauth2-migration.params';
import { SchoolIdParams } from './dto/request/school-id.params';
import { UserLoginMigrationMandatoryParams } from './dto/request/user-login-migration-mandatory.params';

@ApiTags('UserLoginMigration')
@Controller('user-login-migrations')
@Authenticate('jwt')
export class UserLoginMigrationController {
	constructor(
		private readonly userLoginMigrationUc: UserLoginMigrationUc,
		private readonly startUserLoginMigrationUc: StartUserLoginMigrationUc,
		private readonly restartUserLoginMigrationUc: RestartUserLoginMigrationUc,
		private readonly toggleUserLoginMigrationUc: ToggleUserLoginMigrationUc,
		private readonly closeUserLoginMigrationUc: CloseUserLoginMigrationUc
	) {}

	@Get()
	@ApiForbiddenResponse()
	@ApiOperation({
		summary: 'Get UserLoginMigrations',
		description: 'Currently there can only be one migration for a user. Therefore only one migration is returned.',
	})
	@ApiOkResponse({ description: 'UserLoginMigrations has been found.', type: UserLoginMigrationSearchListResponse })
	@ApiInternalServerErrorResponse({ description: 'Cannot find target system information.' })
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

	@Get('schools/:schoolId')
	@ApiForbiddenResponse()
	@ApiOkResponse({ description: 'UserLoginMigrations has been found', type: UserLoginMigrationResponse })
	@ApiNotFoundResponse({ description: 'Cannot find UserLoginMigration' })
	async findUserLoginMigrationBySchool(
		@CurrentUser() user: ICurrentUser,
		@Param() params: SchoolIdParams
	): Promise<UserLoginMigrationResponse> {
		const userLoginMigration: UserLoginMigrationDO = await this.userLoginMigrationUc.findUserLoginMigrationBySchool(
			user.userId,
			params.schoolId
		);

		const response: UserLoginMigrationResponse =
			UserLoginMigrationMapper.mapUserLoginMigrationDoToResponse(userLoginMigration);

		return response;
	}

	@Post('start')
	@ApiUnprocessableEntityResponse({
		description: 'User login migration is already closed and cannot be modified',
		type: UserLoginMigrationAlreadyClosedLoggableException,
	})
	@ApiUnprocessableEntityResponse({
		description: 'School has no official school number',
		type: SchoolNumberMissingLoggableException,
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
	@ApiNotFoundResponse({
		description: 'User login migration was not found',
		type: UserLoginMigrationNotFoundLoggableException,
	})
	@ApiUnprocessableEntityResponse({
		description: 'Grace period for changing the user login migration is expired',
		type: UserLoginMigrationGracePeriodExpiredLoggableException,
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

	@Put('mandatory')
	@ApiNotFoundResponse({
		description: 'User login migration was not found',
		type: UserLoginMigrationNotFoundLoggableException,
	})
	@ApiUnprocessableEntityResponse({
		description: 'Grace period for changing the user login migration is expired',
		type: UserLoginMigrationGracePeriodExpiredLoggableException,
	})
	@ApiUnprocessableEntityResponse({
		description: 'User login migration is already closed and cannot be modified',
		type: UserLoginMigrationAlreadyClosedLoggableException,
	})
	@ApiOkResponse({ description: 'User login migration is set mandatory/optional', type: UserLoginMigrationResponse })
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	async setMigrationMandatory(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() body: UserLoginMigrationMandatoryParams
	): Promise<UserLoginMigrationResponse> {
		const migrationDto: UserLoginMigrationDO = await this.toggleUserLoginMigrationUc.setMigrationMandatory(
			currentUser.userId,
			currentUser.schoolId,
			body.mandatory
		);

		const migrationResponse: UserLoginMigrationResponse =
			UserLoginMigrationMapper.mapUserLoginMigrationDoToResponse(migrationDto);

		return migrationResponse;
	}

	@Post('close')
	@ApiUnprocessableEntityResponse({
		description: 'User login migration is already closed and cannot be modified. Restart is possible.',
		type: UserLoginMigrationAlreadyClosedLoggableException,
	})
	@ApiUnprocessableEntityResponse({
		description: 'User login migration is already closed and cannot be modified. It cannot be restarted.',
		type: UserLoginMigrationGracePeriodExpiredLoggableException,
	})
	@ApiNotFoundResponse({
		description: 'User login migration does not exist',
		type: UserLoginMigrationNotFoundLoggableException,
	})
	@ApiOkResponse({ description: 'User login migration closed', type: UserLoginMigrationResponse })
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	@ApiNoContentResponse({ description: 'User login migration was reverted' })
	async closeMigration(@CurrentUser() currentUser: ICurrentUser): Promise<UserLoginMigrationResponse | undefined> {
		const userLoginMigration: UserLoginMigrationDO | undefined = await this.closeUserLoginMigrationUc.closeMigration(
			currentUser.userId,
			currentUser.schoolId
		);

		if (userLoginMigration) {
			const migrationResponse: UserLoginMigrationResponse =
				UserLoginMigrationMapper.mapUserLoginMigrationDoToResponse(userLoginMigration);
			return migrationResponse;
		}
		return undefined;
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
