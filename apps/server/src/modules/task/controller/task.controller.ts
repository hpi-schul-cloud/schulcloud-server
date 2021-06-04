import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { TaskUC } from '../uc/task.uc';
import { Controller, Get, Query } from '@nestjs/common';
import { TaskResponseDto } from './dto';
import { PaginationResponse } from '../../../shared/core/controller/dto/pagination.response.dto';
import { PaginationQueryDto } from '../../../shared/core/controller/dto/pagination.query.dto';

// TODO: swagger doku do not read from combined query object only from passed single parameter in Query(), but this do not allowed optional querys only required querys

@ApiTags('Task')
@Authenticate('jwt')
@Controller('task')
export class TaskController {
	constructor(private readonly taskUc: TaskUC) {}

	@Get('dashboard')
	async findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() paginationQuery: PaginationQueryDto
	): Promise<PaginationResponse<TaskResponseDto[]>> {
		const { data, limit, offset: skip, total } = await this.taskUc.findAllOpenForUser(
			currentUser.userId,
			paginationQuery
		);
		return new PaginationResponse(data, limit, skip, total);
	}
}
