import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationParams, ParseObjectIdPipe } from '@shared/controller';
import { ICurrentUser, IFindOptions, ImportUser, User } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ImportUserFilterParams } from './dto/import-user-filter-params';
import { ImportUserListResponse, ImportUserResponse } from './dto/import-user-response';
import { UpdateMatchParams } from './dto/update-match-params';
import { UserMatchListResponse } from './dto/user-match-response';

import { ImportUserMapper } from '../mapper/import-user.mapper';
import { UserFilterParams } from './dto/user-filter-params';
import { UserMatchMapper } from '../mapper/user-match.mapper';
import { UserImportUc } from '../uc/user-import.uc';
import { UpdateFlagParams } from './dto/update-flag-params';
import { ImportUserSortingParams } from './dto/import-user-sorting-params';

@ApiTags('UserImport')
@Authenticate('jwt')
@Controller('user/import')
export class ImportUserController {
	constructor(private readonly userImportUc: UserImportUc, private readonly userUc: UserImportUc) {}

	@Get()
	async findAllImportUsers(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: ImportUserFilterParams,
		@Query() sortingQuery: ImportUserSortingParams,
		@Query() paginationParams: PaginationParams
	): Promise<ImportUserListResponse> {
		const options: IFindOptions<ImportUser> = { pagination: paginationParams };
		options.order = ImportUserMapper.mapSortingParamsToDomain(sortingQuery);
		const query = ImportUserMapper.mapImportUserFilterParamsToDomain(scope);
		const [importUserList, count] = await this.userImportUc.findAllImportUsers(currentUser.userId, query, options);
		const { skip, limit } = paginationParams;
		const dtoList = importUserList.map((importUser) => ImportUserMapper.mapToResponse(importUser));
		const response = new ImportUserListResponse(dtoList, count, skip, limit);
		return response;
	}

	@Patch(':id/match')
	async setMatch(
		@Param('id', ParseObjectIdPipe) importUserId: string,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: UpdateMatchParams
	): Promise<ImportUserResponse> {
		const result = await this.userImportUc.setMatch(currentUser.userId, importUserId, params.userId);
		const response = ImportUserMapper.mapToResponse(result);
		return response;
	}

	@Delete(':id/match')
	async removeMatch(
		@Param('id', ParseObjectIdPipe) importUserId: string,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ImportUserResponse> {
		const result = await this.userImportUc.removeMatch(currentUser.userId, importUserId);
		const response = ImportUserMapper.mapToResponse(result);
		return response;
	}

	@Patch(':id/flag')
	async updateFlag(
		@Param('id', ParseObjectIdPipe) importUserId: string,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: UpdateFlagParams
	): Promise<ImportUserResponse> {
		const result = await this.userImportUc.updateFlag(currentUser.userId, importUserId, params.flagged);
		const response = ImportUserMapper.mapToResponse(result);
		return response;
	}

	@Get('unassigned')
	async findAllUnmatchedUsers(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: UserFilterParams,
		@Query() paginationParams: PaginationParams
	): Promise<UserMatchListResponse> {
		const options: IFindOptions<User> = { pagination: paginationParams };

		const query = UserMatchMapper.mapToDomain(scope);
		const [userList, total] = await this.userUc.findAllUnmatchedUsers(currentUser.userId, query, options);
		const { skip, limit } = paginationParams;
		const dtoList = userList.map((user) => UserMatchMapper.mapToResponse(user));
		const response = new UserMatchListResponse(dtoList, total, skip, limit);
		return response as unknown as UserMatchListResponse;
	}

	@Post('migrate')
	async saveAllUsersMatches(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.userImportUc.saveAllUsersMatches(currentUser.userId);
	}
}
