import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PaginationParams } from '@shared/controller';
import { IFindOptions, ImportUser, User } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@src/modules/authentication';

import { ImportUserMapper } from '../mapper/import-user.mapper';
import { UserMatchMapper } from '../mapper/user-match.mapper';
import { UserImportUc } from '../uc/user-import.uc';

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
	constructor(private readonly userImportUc: UserImportUc, private readonly userUc: UserImportUc) {}

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
		const [userList, total] = await this.userUc.findAllUnmatchedUsers(currentUser.userId, query, options);
		const { skip, limit } = pagination;
		const dtoList = userList.map((user) => UserMatchMapper.mapToResponse(user));
		const response = new UserMatchListResponse(dtoList, total, skip, limit);

		return response as unknown as UserMatchListResponse;
	}

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
}
