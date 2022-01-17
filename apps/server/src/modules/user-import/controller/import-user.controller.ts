import { Body, Controller, Delete, Get, ImATeapotException, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQuery, SortingQuery, ParseObjectIdPipe } from '@shared/controller';
import { ICurrentUser, IFindOptions, SortOrder, ImportUser, User } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ImportUserFilterQuery } from './dto/import-user-filter.query';
import { ImportUserListResponse, ImportUserResponse } from './dto/import-user.response';
import { UpdateMatchParams } from './dto/update-match.params';
import { UserDetailsListResponse, UserMatchResponse } from './dto/user-match.response';

import { UserImportUC } from '../uc/user-import.uc';

import { ImportUserMapper } from '../mapper/import-user.mapper';
import { UserFilterQuery } from './dto/user-filter.query';
import { UserUC } from '../uc/user.uc';
import { UserMapper } from '../mapper/user.mapper';

@ApiTags('User')
@Authenticate('jwt')
@Controller('user/import')
export class ImportUserController {
	constructor(private readonly userImportUc: UserImportUC, private readonly userUc: UserUC) {}

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
		const dtoList = importUserList.map((importUser) => ImportUserMapper.mapToResponse(importUser));
		const response = new ImportUserListResponse(dtoList, count, skip, limit);
		return response;
	}

	@Patch(':id/match')
	async updateMatch(
		@Param('id', ParseObjectIdPipe) importUserId: string,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: UpdateMatchParams
	): Promise<ImportUserResponse> {
		const result = await this.userImportUc.setMatch(currentUser.userId, importUserId, params.userId);
		const response = ImportUserMapper.mapToResponse(result);
		return response;
	}

	@Delete(':id/match')
	removeMatch(
		@Param('id', ParseObjectIdPipe) importUserId: string,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		// TODO
		throw new ImATeapotException();
	}

	// @Patch(':id/flag')
	// async updateFlag(
	// 	@Param('id', ParseObjectIdPipe) importUserId: string,
	// 	@CurrentUser() currentUser: ICurrentUser,
	// 	@Body() params: UpdateFlagParams
	// ): Promise<void> {
	// 	const result = await this.userImportUc.setFlag(currentUser.userId, importUserId, params.flagged);
	// }

	@Get('unassigned')
	async findAllUnmatchedUsers(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: UserFilterQuery,
		@Query() paginationQuery: PaginationQuery
	): Promise<UserDetailsListResponse> {
		const options: IFindOptions<User> = { pagination: paginationQuery };

		const query = UserMapper.mapToDomain(scope);
		const userList = await this.userUc.findAllUnmatched(currentUser.userId, query, options);
		const { skip, limit } = paginationQuery;
		const dtoList = await Promise.all(userList.map(async (user) => UserMapper.mapToResponse(user)));
		const response = new UserDetailsListResponse(dtoList, -1, skip, limit); // TODO total missing
		return response as unknown as UserDetailsListResponse;
	}
}
