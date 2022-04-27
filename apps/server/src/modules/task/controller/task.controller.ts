import { Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/';
import { ParseObjectIdPipe } from '@shared/controller/pipe';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { TaskMapper } from '../mapper/task.mapper';
import { TaskUC } from '../uc/task.uc';
import { TaskListResponse, TaskResponse } from './dto';

@ApiTags('Task')
@Authenticate('jwt')
@Controller('tasks')
//@UseInterceptors(LoggingInterceptor)
export class TaskController {
	constructor(private readonly taskUc: TaskUC) {}

	@Get()
	async findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationParams
	): Promise<TaskListResponse> {
		const [tasksWithStatus, total] = await this.taskUc.findAll(currentUser.userId, pagination);
		const taskresponses = tasksWithStatus.map((taskWithStatus) => {
			return TaskMapper.mapToResponse(taskWithStatus);
		});
		const { skip, limit } = pagination;
		const result = new TaskListResponse(taskresponses, total, skip, limit);
		return result;
	}

	@Get('finished')
	async findAllFinished(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationParams
	): Promise<TaskListResponse> {
		const [tasksWithStatus, total] = await this.taskUc.findAllFinished(currentUser.userId, pagination);

		const taskresponses = tasksWithStatus.map((task) => {
			return TaskMapper.mapToResponse(task);
		});

		const { skip, limit } = pagination;
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
