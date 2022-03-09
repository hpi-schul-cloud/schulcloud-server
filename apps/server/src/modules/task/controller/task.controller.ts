import { ApiTags } from '@nestjs/swagger';
import { Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';

import { ICurrentUser } from '@shared/domain';
import { PaginationQuery } from '@shared/controller/';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ParseObjectIdPipe } from '@shared/controller/pipe';
import { TaskUC } from '../uc/task.uc';
import { TaskListResponse, TaskResponse } from './dto';
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
		const [tasksWithStatus, total] = await this.taskUc.findAll(currentUser.userId, paginationQuery);
		const taskresponses = tasksWithStatus.map((taskWithStatus) => {
			return TaskMapper.mapToResponse(taskWithStatus);
		});
		const { skip, limit } = paginationQuery;
		const result = new TaskListResponse(taskresponses, total, skip, limit);
		return result;
	}

	@Get('finished')
	async findAllFinished(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() paginationQuery: PaginationQuery
	): Promise<TaskListResponse> {
		const [tasksWithStatus, total] = await this.taskUc.findAllFinished(currentUser.userId, paginationQuery);

		const taskresponses = tasksWithStatus.map((task) => {
			return TaskMapper.mapToResponse(task);
		});

		const { skip, limit } = paginationQuery;
		const result = new TaskListResponse(taskresponses, total, skip, limit);
		return result;
	}

	@Patch(':id/finish')
	async finish(
		@Param('id', ParseObjectIdPipe) taskId: string,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<TaskResponse> {
		const task = await this.taskUc.changeFinishedForUser(currentUser.userId, taskId, true);

		const response = TaskMapper.mapToResponse(task);

		return response;
	}

	@Patch(':id/restore')
	async restore(
		@Param('id', ParseObjectIdPipe) taskId: string,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<TaskResponse> {
		const task = await this.taskUc.changeFinishedForUser(currentUser.userId, taskId, false);

		const response = TaskMapper.mapToResponse(task);

		return response;
	}

	@Delete(':id')
	async delete(
		@Param('id', ParseObjectIdPipe) taskId: string,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<boolean> {
		const result = await this.taskUc.delete(currentUser.userId, taskId);

		return result;
	}
}
