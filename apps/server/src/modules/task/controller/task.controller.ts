import { ApiTags } from '@nestjs/swagger';

import { ICurrentUser } from '@shared/domain';
import { PaginationQuery } from '@shared/controller/';
import { Controller, Get, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';

import { TaskUC } from '../uc/task.uc';
import { TaskListResponse } from './dto';
import { TaskMapper } from '../mapper/task.mapper';

@ApiTags('Task')
@Authenticate('jwt')
@Controller('tasks')
export class TaskController {
	constructor(private readonly taskUc: TaskUC) {}

	@Get()
	async findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() paginationQuery: PaginationQuery
	): Promise<TaskListResponse> {
		const [tasksWithStatus, total] = await this.taskUc.findAll(currentUser, paginationQuery);
		const taskresponses = tasksWithStatus.map((taskWithStatus) => {
			return TaskMapper.mapToResponse(taskWithStatus);
		});
		const { skip, limit } = paginationQuery;
		const result = new TaskListResponse(taskresponses, total, skip, limit);
		return result;
	}
}
