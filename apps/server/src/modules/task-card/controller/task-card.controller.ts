import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';

import { CreateTaskCardParams, TaskCardResponse } from './dto';
import { TaskCardMapper } from '../mapper/task-card.mapper';
import { TaskCardUc } from '@src/modules/task-card/uc';
import { TaskMapper } from '@src/modules/task/mapper/task.mapper';
import { TaskUC } from '@src/modules/task/uc';

@ApiTags('card')
@Authenticate('jwt')
@Controller('task-card')
export class TaskCardController {
	constructor(private readonly taskCardUc: TaskCardUc, private readonly taskUc: TaskUC) {}

	// async findAll()

	async create(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() params: CreateTaskCardParams
	): Promise<TaskCardResponse> {
		// TODO split per card type here?
		const card = await this.taskCardUc.create(currentUser.userId, TaskCardMapper.mapCreateToDomain(params));
		const dto = TaskCardMapper.mapToResponse(card);
		return dto;
	}

	//@Get(':id')
	//async findOne(@Param() urlParams: CardUrlParams, @CurrentUser() currentUser: ICurrentUser) {}

	// async update
	// async delete
}
