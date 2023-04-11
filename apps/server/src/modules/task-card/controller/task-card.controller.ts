import { Configuration } from '@hpi-schul-cloud/commons';

import { Body, Controller, Delete, Get, InternalServerErrorException, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { TaskCardUc } from '../uc';
import { TaskCardParams, TaskCardResponse, TaskCardUrlParams } from './dto';
import { TaskCardMapper } from './mapper/task-card.mapper';

@ApiTags('Cards')
@Authenticate('jwt')
@Controller('cards/task')
export class TaskCardController {
	constructor(private readonly taskCardUc: TaskCardUc) {}

	@Post()
	async create(@CurrentUser() currentUser: ICurrentUser, @Body() params: TaskCardParams): Promise<TaskCardResponse> {
		this.featureEnabled();

		const mapper = new TaskCardMapper();
		const { card, taskWithStatusVo } = await this.taskCardUc.create(
			currentUser.userId,
			TaskCardMapper.mapToDomain(params)
		);
		const taskCardResponse = mapper.mapToResponse(card, taskWithStatusVo);

		return taskCardResponse;
	}

	@Get(':id')
	async findOne(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: TaskCardUrlParams
	): Promise<TaskCardResponse> {
		this.featureEnabled();

		const { card, taskWithStatusVo } = await this.taskCardUc.findOne(currentUser.userId, urlParams.id);
		const mapper = new TaskCardMapper();
		const taskCardResponse = mapper.mapToResponse(card, taskWithStatusVo);
		return taskCardResponse;
	}

	@Delete(':id')
	async delete(@CurrentUser() currentUser: ICurrentUser, @Param() urlParams: TaskCardUrlParams): Promise<boolean> {
		this.featureEnabled();

		const result = await this.taskCardUc.delete(currentUser.userId, urlParams.id);

		return result;
	}

	@Patch(':id')
	async update(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: TaskCardUrlParams,
		@Body() params: TaskCardParams
	): Promise<TaskCardResponse> {
		this.featureEnabled();

		const { card, taskWithStatusVo } = await this.taskCardUc.update(
			currentUser.userId,
			urlParams.id,
			TaskCardMapper.mapToDomain(params)
		);
		console.log('taskWithStatusVo', taskWithStatusVo.task.users, taskWithStatusVo.task);
		const mapper = new TaskCardMapper();
		const taskCardResponse = mapper.mapToResponse(card, taskWithStatusVo);
		console.log('taskCardResponse', taskCardResponse.assignedUsers, taskCardResponse.task.users);
		return taskCardResponse;
	}

	private featureEnabled() {
		const enabled = Configuration.get('FEATURE_TASK_CARD_ENABLED') as boolean;
		if (!enabled) {
			throw new InternalServerErrorException('Feature not enabled');
		}
	}
}
