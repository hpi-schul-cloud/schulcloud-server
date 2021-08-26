import { ApiTags } from '@nestjs/swagger';

import { ICurrentUser } from '@shared/domain';
import { PaginationResponse, PaginationQuery } from '@shared/controller/';
import { Controller, Get, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';

import { TaskUC } from '../uc/task.uc';
import { TaskResponse } from './dto';
import { TaskMapper } from '../mapper/task.mapper';

@ApiTags('Task')
@Authenticate('jwt')
@Controller('tasks')
export class TaskController {
	constructor(private readonly taskUc: TaskUC) {}

	@Get('open')
	async findAllOpen(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() paginationQuery: PaginationQuery
	): Promise<PaginationResponse<TaskResponse[]>> {
		const [tasksWithStatus, total] = await this.taskUc.findAllOpen(currentUser, paginationQuery);
		const taskresponses = tasksWithStatus.map((taskWithStatus) => {
			return TaskMapper.mapToResponse(taskWithStatus);
		});
		const { skip, limit } = paginationQuery;
		const result = new PaginationResponse(taskresponses, total, skip, limit);
		return result;
	}

	@Get('completed')
	async findAllCompleted(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() paginationQuery: PaginationQuery
	): Promise<PaginationResponse<TaskResponse[]>> {
		const [tasksWithStatus, total] = await this.taskUc.findAllCompleted(currentUser, paginationQuery);
		const taskresponses = tasksWithStatus.map((taskWithStatus) => {
			return TaskMapper.mapToResponse(taskWithStatus);
		});
		const { skip, limit } = paginationQuery;
		const result = new PaginationResponse(taskresponses, total, skip, limit);
		return result;
	}
}
