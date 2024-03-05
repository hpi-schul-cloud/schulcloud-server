import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { EntityNotFoundError, ForbiddenOperationError, ValidationError } from '@shared/common';
import { Authenticate, CurrentUser, ICurrentUser } from '../../../authentication';
import { RequestedRoleEnum } from '../enum';
import { UserByIdParams, UserListResponse, UserResponse, UsersSearchQueryParams } from './dto';
import { UsersAdminApiUc } from '../uc';

@ApiTags('AdminTeachers')
@Authenticate('jwt')
@Controller('users/admin/teachers')
export class AdminApiTeachersController {
	constructor(private readonly uc: UsersAdminApiUc) {}

	@Get()
	@ApiOperation({
		summary: 'Returns all teachers which satisfies the given criteria.',
	})
	@ApiResponse({ status: 200, type: UserListResponse, description: 'Returns a paged list of teachers.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Not authorized.' })
	async searchTeachers(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() params: UsersSearchQueryParams
	): Promise<UserListResponse> {
		return this.uc.findUsersByParams(RequestedRoleEnum.TEACHERS, currentUser.userId, params);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Returns a teacher with given id.' })
	@ApiResponse({ status: 200, type: UserResponse, description: 'Returns the teacher.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Not authorized.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Teacher not found.' })
	async findTeacherById(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: UserByIdParams
	): Promise<UserResponse> {
		return this.uc.findUserById(RequestedRoleEnum.TEACHERS, currentUser.userId, params);
	}
}
