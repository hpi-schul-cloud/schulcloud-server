import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequestTimeout } from '@shared/common';
import { PaginationParams } from '@shared/controller/';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser, JWT } from '@src/modules/authentication/decorator/auth.decorator';
// todo  @src/modules/learnroom/* must be replaced
import { CopyApiResponse } from '@src/modules/learnroom/controller/dto/copy.response';
import { CopyMapper } from '@src/modules/learnroom/mapper/copy.mapper';
import serverConfig from '@src/server.config';
import { TaskMapper } from '../mapper/task.mapper';
import { TaskCopyUC } from '../uc/task-copy.uc';
import { TaskUC } from '../uc/task.uc';
import { TaskListResponse, TaskResponse, TaskUrlParams } from './dto';
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

	@Patch(':taskId/finish')
	async finish(@Param() urlParams: TaskUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<TaskResponse> {
		const task = await this.taskUc.changeFinishedForUser(currentUser.userId, urlParams.taskId, true);

		const response = TaskMapper.mapToResponse(task);

		return response;
	}

	@Patch(':taskId/restore')
	async restore(@Param() urlParams: TaskUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<TaskResponse> {
		const task = await this.taskUc.changeFinishedForUser(currentUser.userId, urlParams.taskId, false);

		const response = TaskMapper.mapToResponse(task);

		return response;
	}

	@Delete(':taskId')
	async delete(
		@Param() urlParams: TaskUrlParams,
		@CurrentUser() currentUser: ICurrentUser,
		@JWT() jwt: string
	): Promise<boolean> {
		const result = await this.taskUc.delete(currentUser.userId, urlParams.taskId, jwt);

		return result;
	}

	@Post(':taskId/copy')
	@RequestTimeout(serverConfig().INCOMING_REQUEST_TIMEOUT_COPY_API)
	async copyTask(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: TaskUrlParams,
		@Body() params: TaskCopyApiParams,
		@JWT() jwt: string
	): Promise<CopyApiResponse> {
		const copyStatus = await this.taskCopyUc.copyTask(
			currentUser.userId,
			urlParams.taskId,
			CopyMapper.mapTaskCopyToDomain(params, jwt)
		);
		const dto = CopyMapper.mapToResponse(copyStatus);
		return dto;
	}
}
