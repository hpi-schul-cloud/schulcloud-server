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

@ApiTags('User')
@Authenticate('jwt')
@Controller('user/import')
export class ImportUserController {
	@Get()
	findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scope: ImportUserFilterQuery,
		@Query() pagination: PaginationQuery
	): Promise<ImportUserListResponse> {
		// TODO
		throw new ImATeapotException();
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
