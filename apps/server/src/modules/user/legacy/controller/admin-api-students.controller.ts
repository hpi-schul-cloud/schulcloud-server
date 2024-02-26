import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { EntityNotFoundError, ForbiddenOperationError, ValidationError } from '@shared/common';
import { Authenticate, CurrentUser, ICurrentUser } from '../../../authentication';
import { UsersAdminContextEnum } from '../enum';
import { UserByIdParams, UserListResponse, UserResponse, UsersSearchQueryParams } from './dto';
import { AdminApiUsersUc } from '../uc';

@ApiTags('AdminStudents')
@Authenticate('jwt')
@Controller('users/admin/students')
export class AdminApiStudentsController {
	constructor(private readonly uc: AdminApiUsersUc) {}

	@Get()
	@ApiOperation({
		summary: 'Returns all students which satisfies the given criteria.',
	})
	@ApiResponse({ status: 200, type: UserListResponse, description: 'Returns a paged list of students.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Not authorized.' })
	async searchAccounts(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() params: UsersSearchQueryParams
	): Promise<UserListResponse> {
		return this.uc.findUsersByParams(UsersAdminContextEnum.STUDENTS, currentUser.userId, params);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Returns an student with given id.' })
	@ApiResponse({ status: 200, type: UserResponse, description: 'Returns the student.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Not authorized.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Student not found.' })
	async findAccountById(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: UserByIdParams
	): Promise<UserResponse> {
		return this.uc.findUserById(UsersAdminContextEnum.STUDENTS, currentUser.userId, params);
	}
}
