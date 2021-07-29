/* istanbul ignore file */
// TODO add tests to improve coverage

import { ApiTags } from '@nestjs/swagger';

import { ICurrentUser } from '@shared/domain';
import { PaginationResponse, PaginationQuery } from '@shared/controller/';
import { Controller, Get, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';

import { TaskUC } from '../uc/task.uc';
import { TaskResponse } from './dto';
import { TaskMapper } from '../mapper/task.mapper';

// TODO: swagger doku do not read from combined query object only from passed single parameter in Query(), but this do not allowed optional querys only required querys
@ApiTags('Task')
@Authenticate('jwt')
@Controller('task')
export class TaskController {
	constructor(private readonly taskUc: TaskUC) {}

	@Get('dashboard')
	async findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() paginationQuery: PaginationQuery
	): Promise<PaginationResponse<TaskResponse[]>> {
		// const [tasks, total] = await this.taskUc.findAllOpen(currentUser, paginationQuery);
		const [tasks, total] = await this.taskUc.findAllOpen(currentUser, paginationQuery);
		const taskresponses = tasks.map(({ task, status }) => {
			return TaskMapper.mapToResponse(task, status);
		});
		const { skip, limit } = paginationQuery;
		const result = new PaginationResponse(taskresponses, total, skip, limit);
		return result;
	}
}
