import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQuery, ParseObjectIdPipe } from '@shared/controller';
import { ICurrentUser, IFindOptions, ImportUser, User } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ImportUserFilterQuery } from './dto/import-user-filter.query';
import { ImportUserListResponse, ImportUserResponse } from './dto/import-user.response';
import { UpdateMatchParams } from './dto/update-match.params';
import { UserMatchListResponse } from './dto/user-match.response';

import { ImportUserMapper } from '../mapper/import-user.mapper';
import { UserFilterQuery } from './dto/user-filter.query';
import { UserMatchMapper } from '../mapper/user-match.mapper';
import { UserImportUc } from '../uc/user-import.uc';
import { UpdateFlagParams } from './dto/update-flag.params';
import { ImportUserSortingQuery } from './dto/import-user-sorting.query';

@ApiTags('UserImport')
@Authenticate('jwt')
@Controller('user/import')
export class ImportUserController {
	constructor(private readonly userImportUc: UserImportUc, private readonly userUc: UserImportUc) {}

	@Get()
	async findAllImportUsers(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: ImportUserFilterQuery,
		@Query() sortingQuery: ImportUserSortingQuery,
		@Query() paginationQuery: PaginationQuery
	): Promise<ImportUserListResponse> {
		const options: IFindOptions<ImportUser> = { pagination: paginationQuery };
		options.order = ImportUserMapper.mapSortingQueryToDomain(sortingQuery);
		const query = ImportUserMapper.mapImportUserFilterQueryToDomain(scope);
		const [importUserList, count] = await this.userImportUc.findAllImportUsers(currentUser.userId, query, options);
		const { skip, limit } = paginationQuery;
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
		@Query() scope: UserFilterQuery,
		@Query() paginationQuery: PaginationQuery
	): Promise<UserMatchListResponse> {
		const options: IFindOptions<User> = { pagination: paginationQuery };

		const query = UserMatchMapper.mapToDomain(scope);
		const [userList, total] = await this.userUc.findAllUnmatchedUsers(currentUser.userId, query, options);
		const { skip, limit } = paginationQuery;
		const dtoList = userList.map((user) => UserMatchMapper.mapToResponse(user));
		const response = new UserMatchListResponse(dtoList, total, skip, limit);
		return response as unknown as UserMatchListResponse;
	}
}
