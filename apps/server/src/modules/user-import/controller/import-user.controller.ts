import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNoContentResponse,
	ApiOperation,
	ApiServiceUnavailableResponse,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequestTimeout } from '@shared/common';
import { PaginationParams } from '@shared/controller';
import { ImportUser, User } from '@shared/domain/entity';
import { IFindOptions } from '@shared/domain/interface';
import { ImportUserMapper, UserMatchMapper } from '../mapper';
import { UserImportFetchUc, UserImportUc } from '../uc';
import {
	FilterImportUserParams,
	FilterUserParams,
	ImportUserListResponse,
	ImportUserResponse,
	ImportUserUrlParams,
	SortImportUserParams,
	UpdateFlagParams,
	UpdateMatchParams,
	UserMatchListResponse,
} from './dto';

@ApiTags('UserImport')
@Authenticate('jwt')
@Controller('user/import')
export class ImportUserController {
	constructor(private readonly userImportUc: UserImportUc, private readonly userImportFetchUc: UserImportFetchUc) {}

	@Get()
	async findAllImportUsers(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: FilterImportUserParams,
		@Query() sortingQuery: SortImportUserParams,
		@Query() pagination: PaginationParams
	): Promise<ImportUserListResponse> {
		const options: IFindOptions<ImportUser> = { pagination };
		options.order = ImportUserMapper.mapSortingQueryToDomain(sortingQuery);
		const query = ImportUserMapper.mapImportUserFilterQueryToDomain(scope);
		const [importUserList, count] = await this.userImportUc.findAllImportUsers(currentUser.userId, query, options);
		const { skip, limit } = pagination;
		const dtoList = importUserList.map((importUser) => ImportUserMapper.mapToResponse(importUser));
		const response = new ImportUserListResponse(dtoList, count, skip, limit);

		return response;
	}

	@Patch(':importUserId/match')
	async setMatch(
		@Param() urlParams: ImportUserUrlParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: UpdateMatchParams
	): Promise<ImportUserResponse> {
		const result = await this.userImportUc.setMatch(currentUser.userId, urlParams.importUserId, params.userId);
		const response = ImportUserMapper.mapToResponse(result);

		return response;
	}

	@Delete(':importUserId/match')
	async removeMatch(
		@Param() urlParams: ImportUserUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ImportUserResponse> {
		const result = await this.userImportUc.removeMatch(currentUser.userId, urlParams.importUserId);
		const response = ImportUserMapper.mapToResponse(result);

		return response;
	}

	@Patch(':importUserId/flag')
	async updateFlag(
		@Param() urlParams: ImportUserUrlParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: UpdateFlagParams
	): Promise<ImportUserResponse> {
		const result = await this.userImportUc.updateFlag(currentUser.userId, urlParams.importUserId, params.flagged);
		const response = ImportUserMapper.mapToResponse(result);

		return response;
	}

	@Get('unassigned')
	async findAllUnmatchedUsers(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: FilterUserParams,
		@Query() pagination: PaginationParams
	): Promise<UserMatchListResponse> {
		const options: IFindOptions<User> = { pagination };

		const query = UserMatchMapper.mapToDomain(scope);
		const [userList, total] = await this.userImportUc.findAllUnmatchedUsers(currentUser.userId, query, options);
		const { skip, limit } = pagination;
		const dtoList = userList.map((user) => UserMatchMapper.mapToResponse(user));
		const response = new UserMatchListResponse(dtoList, total, skip, limit);

		return response as unknown as UserMatchListResponse;
	}

	@RequestTimeout('IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS')
	@Post('migrate')
	async saveAllUsersMatches(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.userImportUc.saveAllUsersMatches(currentUser.userId);
	}

	@Post('startUserMigration')
	async startSchoolInUserMigration(
		@CurrentUser() currentUser: ICurrentUser,
		@Query('useCentralLdap') useCentralLdap?: boolean
	): Promise<void> {
		await this.userImportUc.startSchoolInUserMigration(currentUser.userId, useCentralLdap);
	}

	@Post('startSync')
	async endSchoolInMaintenance(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.userImportUc.endSchoolInMaintenance(currentUser.userId);
	}

	@RequestTimeout('SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS')
	@Post('populate-import-users')
	@ApiOperation({
		summary: 'Populates import users',
		description: 'Populates import users from specific user migration populate endpoint.',
	})
	@ApiCreatedResponse()
	@ApiUnauthorizedResponse()
	@ApiServiceUnavailableResponse()
	@ApiBadRequestResponse()
	@ApiForbiddenResponse()
	async populateImportUsers(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.userImportFetchUc.populateImportUsers(currentUser.userId);
	}

	@Post('cancel')
	@ApiOperation({
		summary: 'Cancel migration wizard',
		description: 'Cancel current migration process',
	})
	@ApiNoContentResponse()
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	@HttpCode(HttpStatus.NO_CONTENT)
	async cancelMigration(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.userImportUc.cancelMigration(currentUser.userId);
	}
}
