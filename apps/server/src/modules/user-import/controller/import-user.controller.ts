import { Body, Controller, Delete, Get, ImATeapotException, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQuery, SortingQuery, ParseObjectIdPipe } from '@shared/controller';
import { ICurrentUser, IFindOptions, SortOrder, ImportUser, User } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ImportUserFilterQuery } from './dto/import-user-filter.query';
import { ImportUserListResponse } from './dto/import-user.response';
import { UpdateMatchParams } from './dto/update-match.params';
import { UserDetailsListResponse, UserDetailsResponse, UserMatchResponse } from './dto/user-match.response';

import { UserImportUC } from '../uc/user-import.uc';

import { ImportUserMapper } from '../mapper/import-user.mapper';
import { UserFilterQuery } from './dto/user-filter.query';

@ApiTags('User')
@Authenticate('jwt')
@Controller('user/import')
export class ImportUserController {
	constructor(private readonly userImportUc: UserImportUC) {}

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
	updateMatch(
		@Param('id', ParseObjectIdPipe) importUserId: string,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: UpdateMatchParams
	): Promise<UserMatchResponse> {
		// TODO
		throw new ImATeapotException();
	}

	@Delete(':id/match')
	removeMatch(
		@Param('id', ParseObjectIdPipe) importUserId: string,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		// TODO
		throw new ImATeapotException();
	}

	@Get('unassigned')
	async findAllUnassignedUsers(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: UserFilterQuery,
		@Query() paginationQuery: PaginationQuery
	): Promise<UserDetailsListResponse> {
		const options: IFindOptions<User> = { pagination: paginationQuery };

		// const query = ImportUserMapper.mapUserFilterQueryToDomain(scope);
		const [userList, count] = await this.userImportUc.findAllUnassignedUsers(
			currentUser.userId,
			{
				/* query */
			},
			options
		);
		const { skip, limit } = paginationQuery;
		// const dtoList = userList.map((user) => UserDetailsMapper.mapToResponse(user));
		const response = new UserDetailsListResponse(
			[
				/* dtoList */
			],
			0, // count,
			skip,
			limit
		);
		return response as unknown as UserDetailsListResponse;
	}
}
