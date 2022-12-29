import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { CreateTaskCardParams, TaskCardResponse, TaskCardUrlParams, UpdateTaskCardParams } from './dto';
import { TaskCardMapper } from '../mapper/task-card.mapper';
import { TaskCardUc } from '../uc';

@ApiTags('Cards')
@Authenticate('jwt')
@Controller('cards/task')
export class TaskCardController {
	constructor(private readonly taskCardUc: TaskCardUc) {}

	@Post()
	async create(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: CreateTaskCardParams
	): Promise<TaskCardResponse> {
		const mapper = new TaskCardMapper();
		const { card, taskWithStatusVo } = await this.taskCardUc.create(
			currentUser.userId,
			TaskCardMapper.mapCreateToDomain(params)
		);
		const taskCardResponse = mapper.mapToResponse(card, taskWithStatusVo);

		return taskCardResponse;
	}

	@Get(':id')
	async findOne(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: TaskCardUrlParams
	): Promise<TaskCardResponse> {
		const { card, taskWithStatusVo } = await this.taskCardUc.findOne(currentUser.userId, urlParams.id);
		const mapper = new TaskCardMapper();
		const taskCardResponse = mapper.mapToResponse(card, taskWithStatusVo);
		return taskCardResponse;
	}

	// async update
	@Delete(':id')
	async delete(@CurrentUser() currentUser: ICurrentUser, @Param() urlParams: TaskCardUrlParams): Promise<boolean> {
		const result = await this.taskCardUc.delete(currentUser.userId, urlParams.id);

		return result;
	}

	@Patch(':id')
	async update(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: TaskCardUrlParams,
		@Body() params: UpdateTaskCardParams
	): Promise<TaskCardResponse> {
		const { card, taskWithStatusVo } = await this.taskCardUc.update(
			currentUser.userId,
			urlParams.id,
			TaskCardMapper.mapUpdateToDomain(params)
		);
		const mapper = new TaskCardMapper();
		const taskCardResponse = mapper.mapToResponse(card, taskWithStatusVo);
		return taskCardResponse;
	}
}
