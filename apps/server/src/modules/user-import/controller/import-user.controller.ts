/* istanbul ignore file */ // TODO remove when implementation exists
import { Body, Controller, Delete, Get, ImATeapotException, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQuery, SortingQuery, ParseObjectIdPipe } from '@shared/controller';
import { ICurrentUser, IFindOptions, SortOrder, ImportUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ImportUserFilterQuery } from './dto/import-user-filter.query';
import { ImportUserListResponse } from './dto/import-user.response';
import { UpdateMatchParams } from './dto/update-match.params';
import { UserMatchResponse } from './dto/user-match.response';

import { UserImportUC } from '../uc/user-import.uc';

import { ImportUserMapper } from '../mapper/import-user.mapper';

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
		const [importUserList, count] = await this.userImportUc.findAll(
			currentUser.userId,
			ImportUserMapper.mapImportUserFilterQueryToDomain(scope),
			options
		);
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
}
