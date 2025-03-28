import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EntityNotFoundError, ForbiddenOperationError, ValidationError } from '@shared/common/error';
import { RequestedRoleEnum } from '../enum';
import { UsersAdminApiUc } from '../uc';
import { UserByIdParams, UserListResponse, UserResponse, UsersSearchQueryParams } from './dto';

@ApiTags('AdminStudents')
@JwtAuthentication()
@Controller('users/admin/students')
export class AdminApiStudentsController {
	constructor(private readonly uc: UsersAdminApiUc) {}

	@Get()
	@ApiOperation({
		summary: 'Returns all students which satisfies the given criteria.',
	})
	@ApiResponse({ status: 200, type: UserListResponse, description: 'Returns a paged list of students.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Not authorized.' })
	async searchStudents(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() params: UsersSearchQueryParams
	): Promise<UserListResponse> {
		return this.uc.findUsersByParams(RequestedRoleEnum.STUDENTS, currentUser.userId, params);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Returns an student with given id.' })
	@ApiResponse({ status: 200, type: UserResponse, description: 'Returns the student.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Not authorized.' })
	@ApiResponse({ status: 404, type: EntityNotFoundError, description: 'Student not found.' })
	async findStudentById(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: UserByIdParams
	): Promise<UserResponse> {
		return this.uc.findUserById(RequestedRoleEnum.STUDENTS, currentUser.userId, params);
	}
}
