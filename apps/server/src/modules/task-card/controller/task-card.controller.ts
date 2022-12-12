import { Body, Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { PaginationParams } from '@shared/controller';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { CreateTaskCardParams, TaskCardResponse } from './dto';
import { TaskCardMapper } from '../mapper/task-card.mapper';
import { TaskCardUc } from '../uc';

@ApiTags('card')
@Authenticate('jwt')
@Controller('task-card')
export class TaskCardController {
	constructor(private readonly taskCardUc: TaskCardUc) {}

	// async findAll()

	async create(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: CreateTaskCardParams
	): Promise<TaskCardResponse> {
		const mapper = new TaskCardMapper();
		const { card, taskWithStatusVo } = await this.taskCardUc.create(
			currentUser.userId,
			TaskCardMapper.mapCreateToDomain(params)
		);
		const taskCardDto = mapper.mapToResponse(card, taskWithStatusVo);

		return taskCardDto;
	}

	// @Get(':id')
	// async findOne(@Param() urlParams: CardUrlParams, @CurrentUser() currentUser: ICurrentUser) {}

	// async update
	// async delete
}
