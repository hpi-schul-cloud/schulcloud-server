import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { CopyApiResponse, CopyMapper } from '@modules/copy-helper';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequestTimeout } from '@shared/common/decorators';
import { PaginationParams } from '@shared/controller/dto';
import { TASK_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY } from '../timeout.config';
import { TaskCopyApiParams, TaskListResponse, TaskResponse, TaskUrlParams } from './dto';
import { TaskMapper } from './mapper';
import { TaskCopyUC } from './task-copy.uc';
import { TaskUC } from './task.uc';

@ApiTags('Task')
@JwtAuthentication()
@Controller('tasks')
export class TaskController {
	constructor(private readonly taskUc: TaskUC, private readonly taskCopyUc: TaskCopyUC) {}

	@Get()
	public async findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationParams
	): Promise<TaskListResponse> {
		return this.findAllTasks(currentUser, pagination);
	}

	@Get('finished')
	public async findAllFinished(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationParams
	): Promise<TaskListResponse> {
		return this.findAllTasks(currentUser, pagination, true);
	}

	private async findAllTasks(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationParams,
		finished = false
	): Promise<TaskListResponse> {
		const [tasksWithStatus, total] = finished
			? await this.taskUc.findAllFinished(currentUser.userId, pagination)
			: await this.taskUc.findAll(currentUser.userId, pagination);

		const taskResponses = tasksWithStatus.map((task) => TaskMapper.mapToResponse(task));

		const { skip, limit } = pagination;
		const result = new TaskListResponse(taskResponses, total, skip, limit);
		return result;
	}

	@Patch(':taskId/finish')
	public async finish(
		@Param() urlParams: TaskUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<TaskResponse> {
		const task = await this.taskUc.changeFinishedForUser(currentUser.userId, urlParams.taskId, true);

		const response = TaskMapper.mapToResponse(task);

		return response;
	}

	@Patch(':taskId/restore')
	public async restore(
		@Param() urlParams: TaskUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<TaskResponse> {
		const task = await this.taskUc.changeFinishedForUser(currentUser.userId, urlParams.taskId, false);

		const response = TaskMapper.mapToResponse(task);

		return response;
	}

	@Patch(':taskId/revertPublished')
	public async revertPublished(
		@Param() urlParams: TaskUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<TaskResponse> {
		const task = await this.taskUc.revertPublished(currentUser.userId, urlParams.taskId);

		const response = TaskMapper.mapToResponse(task);

		return response;
	}

	@Post(':taskId/copy')
	@RequestTimeout(TASK_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY)
	public async copyTask(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: TaskUrlParams,
		@Body() params: TaskCopyApiParams
	): Promise<CopyApiResponse> {
		const copyStatus = await this.taskCopyUc.copyTask(
			currentUser.userId,
			urlParams.taskId,
			CopyMapper.mapTaskCopyToDomain(params, currentUser.userId)
		);
		const dto = CopyMapper.mapToResponse(copyStatus);

		return dto;
	}

	@Delete(':taskId')
	public async delete(@Param() urlParams: TaskUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<boolean> {
		const result = await this.taskUc.delete(currentUser.userId, urlParams.taskId);

		return result;
	}
}
