import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { TaskUC } from '../uc/task.uc';
import { Controller, Get, Query } from '@nestjs/common';
import { TaskResponseDto, QueryDto } from './dto';

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
