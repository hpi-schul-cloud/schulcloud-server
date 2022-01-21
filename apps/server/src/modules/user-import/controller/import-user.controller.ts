import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQuery, SortingQuery, ParseObjectIdPipe } from '@shared/controller';
import { ICurrentUser, IFindOptions, SortOrder, ImportUser, User } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ImportUserFilterQuery } from './dto/import-user-filter.query';
import { ImportUserListResponse, ImportUserResponse } from './dto/import-user.response';
import { UpdateMatchParams } from './dto/update-match.params';
import { UserListResponse } from './dto/user.response';

import { ImportUserMapper } from '../mapper/import-user.mapper';
import { UserFilterQuery } from './dto/user-filter.query';
import { UserMapper } from '../mapper/user.mapper';
import { UserImportUc } from '../uc/user-import.uc';
import { UpdateFlagParams } from './dto/update-flag.params';

@ApiTags('User')
@Authenticate('jwt')
@Controller('user/import')
export class ImportUserController {
	constructor(private readonly userImportUc: UserImportUc, private readonly userUc: UserImportUc) {}

	@Get()
	async findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: ImportUserFilterQuery,
		@Query() sortingQuery: SortingQuery,
		@Query() paginationQuery: PaginationQuery
	): Promise<ImportUserListResponse> {
		const options: IFindOptions<ImportUser> = { pagination: paginationQuery };
		if (sortingQuery.sortBy) {
			options.order = { [sortingQuery.sortBy]: sortingQuery.sortOrder || SortOrder.asc };
		}
		const query = ImportUserMapper.mapImportUserFilterQueryToDomain(scope);
		const [importUserList, count] = await this.userImportUc.findAll(currentUser.userId, query, options);
		const { skip, limit } = paginationQuery;
		const dtoList = await Promise.all(
			importUserList.map(async (importUser) => ImportUserMapper.mapToResponse(importUser))
		);
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
		const result = await this.userImportUc.setFlag(currentUser.userId, importUserId, params.flagged);
		const response = ImportUserMapper.mapToResponse(result);
		return response;
	}

	@Get('unassigned')
	async findAllUnmatchedUsers(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: UserFilterQuery,
		@Query() paginationQuery: PaginationQuery
	): Promise<UserListResponse> {
		const options: IFindOptions<User> = { pagination: paginationQuery };

		const query = UserMapper.mapToDomain(scope);
		const userList = await this.userUc.findAllUnmatchedUsers(currentUser.userId, query, options);
		const { skip, limit } = paginationQuery;
		const dtoList = await Promise.all(userList.map(async (user) => UserMapper.mapToResponse(user)));
		const response = new UserListResponse(dtoList, -1, skip, limit); // TODO total missing
		return response as unknown as UserListResponse;
	}
}
