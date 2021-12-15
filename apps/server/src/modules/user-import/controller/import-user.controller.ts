import { Body, Controller, Delete, Get, ImATeapotException, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQuery, ParseObjectIdPipe } from '../../../shared/controller';
import { ICurrentUser } from '../../../shared/domain';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ImportUserFilterQuery } from './dto/import-user-filter.query';
import { ImportUserListResponse, ImportUserResponse } from './dto/import-user.response';
import { UpdateMatchParams } from './dto/update-match.params';

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

	@Patch(':id')
	updateMatch(
		@Param('id', ParseObjectIdPipe) importUserId: string,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: UpdateMatchParams
	): Promise<ImportUserResponse> {
		// TODO
		throw new ImATeapotException();
	}

	@Delete(':id')
	removeMatch(
		@Param('id', ParseObjectIdPipe) importUserId: string,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ImportUserResponse> {
		// TODO
		throw new ImATeapotException();
	}
}
