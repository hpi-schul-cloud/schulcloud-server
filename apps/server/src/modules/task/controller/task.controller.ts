import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { CopyApiResponse, CopyMapper } from '@modules/copy-helper';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequestTimeout } from '@shared/common';
import { PaginationParams } from '@shared/controller/';
import { TaskMapper } from '../mapper';
import { TaskCopyUC } from '../uc/task-copy.uc';
import { TaskUC } from '../uc/task.uc';
import { TaskListResponse, TaskResponse, TaskUrlParams } from './dto';
import { TaskCopyApiParams } from './dto/task-copy.params';

@ApiTags('Task')
@JwtAuthentication()
@Controller('tasks')
export class TaskController {
	constructor(private readonly taskUc: TaskUC, private readonly taskCopyUc: TaskCopyUC) {}

	@Get()
	async findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationParams
	): Promise<TaskListResponse> {
		return this.findAllTasks(currentUser, pagination);
	}

	@Get('finished')
	async findAllFinished(
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

	@Patch(':taskId/revertPublished')
	async revertPublished(
		@Param() urlParams: TaskUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<TaskResponse> {
		const task = await this.taskUc.revertPublished(currentUser.userId, urlParams.taskId);

		const response = TaskMapper.mapToResponse(task);

		return response;
	}

	@Post(':taskId/copy')
	@RequestTimeout('INCOMING_REQUEST_TIMEOUT_COPY_API')
	async copyTask(
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
	async delete(@Param() urlParams: TaskUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<boolean> {
		const result = await this.taskUc.delete(currentUser.userId, urlParams.taskId);

		return result;
	}
}
