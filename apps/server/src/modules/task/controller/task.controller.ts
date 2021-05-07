import { PaginationQueryDto } from '../../../shared/core/controller/dto/pagination.query.dto';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { TaskUC } from '../uc/task.uc';
import { Controller, Get, Query } from '@nestjs/common';
import { TaskResponseDto } from './dto/task-response.dto';

@ApiTags('Task')
@Authenticate('jwt')
@Controller('task')
export class TaskController {
	constructor(private readonly taskUc: TaskUC) {}

	@Get('dashboard')
	async findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationQueryDto
	): Promise<TaskResponseDto[]> {
		const response = new TaskResponseDto({ title: 'experimental creation of black holes' });
		return [response];
	}
}
