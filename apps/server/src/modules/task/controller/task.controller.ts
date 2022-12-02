import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequestTimeout } from '@shared/common';
import { PaginationParams } from '@shared/controller/';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
// todo  @src/modules/learnroom/* must be replaced
import { CopyApiResponse } from '@src/modules/learnroom/controller/dto/copy.response';
import { CopyMapper } from '@src/modules/learnroom/mapper/copy.mapper';
import { serverConfig } from '@src/modules/server/server.config';
import { TaskMapper } from '../mapper';
import { TaskCopyUC } from '../uc/task-copy.uc';
import { TaskUC } from '../uc/task.uc';
import { TaskListResponse, TaskResponse, TaskUrlParams, TaskCreateParams, TaskUpdateParams } from './dto';
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

		const taskResponses = tasksWithStatus.map((task) => {
			return TaskMapper.mapToResponse(task);
		});

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

	@Post(':taskId/copy')
	@RequestTimeout(serverConfig().INCOMING_REQUEST_TIMEOUT_COPY_API)
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

	@Get(':taskId')
	async findTask(@Param() urlParams: TaskUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<TaskResponse> {
		const taskWithSatusVo = await this.taskUc.find(currentUser.userId, urlParams.taskId);

		const response = TaskMapper.mapToResponse(taskWithSatusVo);
		return response;
	}

	@Post()
	async create(@Body() params: TaskCreateParams, @CurrentUser() currentUser: ICurrentUser): Promise<TaskResponse> {
		const taskWithSatusVo = await this.taskUc.create(currentUser.userId, TaskMapper.mapTaskCreateToDomain(params));

		const response = TaskMapper.mapToResponse(taskWithSatusVo);
		return response;
	}

	@Patch(':taskId')
	async update(
		@Param() urlParams: TaskUrlParams,
		@Body() params: TaskUpdateParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<TaskResponse> {
		const taskWithSatusVo = await this.taskUc.update(
			currentUser.userId,
			urlParams.taskId,
			TaskMapper.mapTaskUpdateToDomain(params)
		);

		const response = TaskMapper.mapToResponse(taskWithSatusVo);

		return response;
	}

	@Delete(':taskId')
	async delete(@Param() urlParams: TaskUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<boolean> {
		const result = await this.taskUc.delete(currentUser.userId, urlParams.taskId);

		return result;
	}
}
