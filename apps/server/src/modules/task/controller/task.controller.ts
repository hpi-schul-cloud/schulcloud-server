import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { TaskUC } from '../uc/task.uc';
import { Controller, Get, Query } from '@nestjs/common';
import { TaskResponseDto, PaginationQueryDto, YearsQueryDto } from './dto';

// TODO: override pipe to pass combined querys to it

@ApiTags('Task')
@Authenticate('jwt')
@Controller('task')
export class TaskController {
	constructor(private readonly taskUc: TaskUC) {}

	@Get('dashboard')
	async findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query('year?') year: YearsQueryDto,
		@Query('pagination?') pagination: PaginationQueryDto,
	): Promise<TaskResponseDto[]> {
		const query = { year, pagination };
		const response = this.taskUc.findAllOpenForUser(currentUser.userId, query);
		return response;
	}
}
