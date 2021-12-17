/* istanbul ignore file */ // TODO remove when implementation exists
import { Body, Controller, Delete, Get, ImATeapotException, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQuery, ParseObjectIdPipe } from '@shared/controller';
import { ICurrentUser } from '@shared/domain';
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
		@Query() pagination: PaginationQuery
	): Promise<ImportUserListResponse> {
		const [importUserList, count] = await this.userImportUc.findAll(
			currentUser,
			ImportUserMapper.mapNewsScopeToDomain(scope),
			{ pagination }
		);
		const dtoList = importUserList.map((importUser) => ImportUserMapper.mapToResponse(importUser));
		const response = new ImportUserListResponse(dtoList, count);
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
