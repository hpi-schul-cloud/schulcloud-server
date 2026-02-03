import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
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
import { RequestTimeout } from '@shared/common/decorators';
import { PaginationParams } from '@shared/controller/dto';
import { IFindOptions } from '@shared/domain/interface';
import { ImportUser } from '../entity';
import { ImportUserMapper, UserMatchMapper } from '../mapper';
import {
	IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS_KEY,
	SCHULCONNEX_CLIENT_PERSONEN_INFO_TIMEOUT_IN_MS_KEY,
} from '../timeout.config';
import { PopulateUserImportFetchUc, UserImportUc } from '../uc';
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
import { PopulateImportUserParams } from './dto/populate-import-user.params';

@ApiTags('UserImport')
@JwtAuthentication()
@Controller('user/import')
export class ImportUserController {
	constructor(
		private readonly userImportUc: UserImportUc,
		private readonly populateUserImportFetchUc: PopulateUserImportFetchUc
	) {}

	@Get()
	public async findAllImportUsers(
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
	public async setMatch(
		@Param() urlParams: ImportUserUrlParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: UpdateMatchParams
	): Promise<ImportUserResponse> {
		const result = await this.userImportUc.setMatch(currentUser.userId, urlParams.importUserId, params.userId);
		const response = ImportUserMapper.mapToResponse(result);

		return response;
	}

	@Delete(':importUserId/match')
	public async removeMatch(
		@Param() urlParams: ImportUserUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ImportUserResponse> {
		const result = await this.userImportUc.removeMatch(currentUser.userId, urlParams.importUserId);
		const response = ImportUserMapper.mapToResponse(result);

		return response;
	}

	@Patch(':importUserId/flag')
	public async updateFlag(
		@Param() urlParams: ImportUserUrlParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: UpdateFlagParams
	): Promise<ImportUserResponse> {
		const result = await this.userImportUc.updateFlag(currentUser.userId, urlParams.importUserId, params.flagged);
		const response = ImportUserMapper.mapToResponse(result);

		return response;
	}

	@Get('unassigned')
	public async findAllUnmatchedUsers(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: FilterUserParams,
		@Query() pagination: PaginationParams
	): Promise<UserMatchListResponse> {
		const query = UserMatchMapper.mapToDomain(scope);
		const [userList, total] = await this.userImportUc.findAllUnmatchedUsers(currentUser.userId, query, { pagination });

		const dtoList = userList.map((user) => UserMatchMapper.mapToResponse(user));
		const response = new UserMatchListResponse(dtoList, total, pagination.skip, pagination.limit);

		return response;
	}

	@RequestTimeout(IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS_KEY)
	@Post('migrate')
	public async saveAllUsersMatches(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.userImportUc.saveAllUsersMatches(currentUser.userId);
	}

	@Post('startUserMigration')
	public async startSchoolInUserMigration(
		@CurrentUser() currentUser: ICurrentUser,
		@Query('useCentralLdap') useCentralLdap?: boolean
	): Promise<void> {
		await this.userImportUc.startSchoolInUserMigration(currentUser.userId, useCentralLdap);
	}

	@Post('startSync')
	public async endSchoolInMaintenance(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.userImportUc.endSchoolInMaintenance(currentUser.userId);
	}

	@RequestTimeout(SCHULCONNEX_CLIENT_PERSONEN_INFO_TIMEOUT_IN_MS_KEY)
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
	public async populateImportUsers(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() query: PopulateImportUserParams
	): Promise<void> {
		await this.populateUserImportFetchUc.populateImportUsers(currentUser.userId, query.matchByPreferredName);
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
	public async cancelMigration(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.userImportUc.cancelMigration(currentUser.userId);
	}

	@Patch('clear-all-auto-matches')
	@ApiOperation({
		summary: 'Clear all auto matches',
		description: 'Clear all auto matches from imported users of a school',
	})
	@ApiNoContentResponse()
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	@HttpCode(HttpStatus.NO_CONTENT)
	public async clearAllAutoMatches(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.userImportUc.clearAllAutoMatches(currentUser.userId);
	}
}
