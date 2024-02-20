import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { EntityNotFoundError, ForbiddenOperationError, ValidationError } from '@shared/common';
import { Authenticate, CurrentUser, ICurrentUser } from '../../../authentication';
import { UsersAdminContextEnum } from '../enum';
import { UserByIdParams, UserListResponse, UserResponse, UsersSearchQueryParams } from './dto';
import { AdminApiUsersUc } from '../uc';

@ApiTags('AdminTeachers')
@Authenticate('jwt')
@Controller('users/admin/teachers')
export class AdminApiTeachersController {
	constructor(private readonly uc: AdminApiUsersUc) {}

	@Get()
	@ApiOperation({
		summary: 'Returns all teachers which satisfies the given criteria.',
	})
	@ApiResponse({ status: 200, type: UserListResponse, description: 'Returns a paged list of teachers.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 401, type: ForbiddenOperationError, description: 'Not authenticated.' })
	async searchAccounts(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() params: UsersSearchQueryParams
	): Promise<UserListResponse> {
		return this.uc.findUsersByParams(UsersAdminContextEnum.TEACHERS, currentUser.userId, params);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Returns a teacher with given id.' })
	@ApiResponse({ status: 200, type: UserResponse, description: 'Returns the teacher.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 401, type: ForbiddenOperationError, description: 'Not authenticated.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Teacher not found.' })
	async findAccountById(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: UserByIdParams
	): Promise<UserResponse> {
		return this.uc.findUserById(UsersAdminContextEnum.TEACHERS, currentUser.userId, params);
	}
}
