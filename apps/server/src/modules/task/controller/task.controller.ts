import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/';
import { ParseObjectIdPipe } from '@shared/controller/pipe';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { CopyApiResponse } from '@src/modules/learnroom/controller/dto/copy.response';
import { CopyMapper } from '@src/modules/learnroom/mapper/copy.mapper';
import { TaskMapper } from '../mapper/task.mapper';
import { TaskCopyUC } from '../uc/task-copy.uc';
import { TaskUC } from '../uc/task.uc';
import { TaskListResponse, TaskResponse } from './dto';
import { TaskCopyApiParams } from './dto/task-copy.params';

@ApiTags('Task')
@Authenticate('jwt')
@Controller('tasks')
export class TaskController {
	constructor(private readonly taskUc: TaskUC, private readonly taskCopyUc: TaskCopyUC) {}

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

	@Post(':id/copy')
	async copyTask(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('id', ParseObjectIdPipe) taskId: string,
		@Body() params: TaskCopyApiParams
	): Promise<CopyApiResponse> {
		const copyStatus = await this.taskCopyUc.copyTask(
			currentUser.userId,
			taskId,
			CopyMapper.mapTaskCopyToDomain(params)
		);
		const dto = CopyMapper.mapToResponse(copyStatus);
		return dto;
	}
}
