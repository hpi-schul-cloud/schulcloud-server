import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { PaginationParams } from '@shared/controller';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { CreateTaskCardParams, TaskCardResponse, TaskCardUrlParams } from './dto';
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
	async find(@CurrentUser() currentUser: ICurrentUser, @Param() urlParams: TaskCardUrlParams) {
		const { card, taskWithStatusVo } = await this.taskCardUc.find(currentUser.userId, urlParams.id);
		const mapper = new TaskCardMapper();
		const taskCardResponse = mapper.mapToResponse(card, taskWithStatusVo);
		return taskCardResponse;
	}

	// async update
	// async delete
}
