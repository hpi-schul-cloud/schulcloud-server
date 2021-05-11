import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { TaskUC } from '../uc/task.uc';
import { Controller, Get, Query, Param } from '@nestjs/common';
import { TaskResponseDto, QueryDto } from './dto';

// TODO: override pipe to pass combined querys to it
// TODO: pagination limits maybe a problem we should think about it, but is fine if want the global max and defaults
@ApiTags('Task')
@Authenticate('jwt')
@Controller('task')
export class TaskController {
	constructor(private readonly taskUc: TaskUC) {}

	@Get('dashboard')
	async findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() query: QueryDto,
	): Promise<TaskResponseDto[]> {
		const response = this.taskUc.findAllOpenForUser(currentUser.userId, query);
		return response;
	}
}
