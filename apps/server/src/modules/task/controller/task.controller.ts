import { PaginationQueryDto } from '../../../shared/core/controller/dto/pagination.query.dto';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { TaskUC } from '../uc/task.uc';
import { Controller, Get, Query } from '@nestjs/common';
import { TaskResponseDto } from './dto/task-response.dto';

@ApiTags('Task')
@Authenticate('jwt')
@Controller('task')
export class TaskController {
	constructor(private readonly taskUc: TaskUC) {}

	@Get('dashboard')
	async findAll(
		@CurrentUser() currentUser: ICurrentUser
		//@Query() pagination: PaginationQueryDto
	): Promise<TaskResponseDto[]> {
		const response = [
			new TaskResponseDto({
				title: 'experimental creation of black holes',
				duedate: new Date(),
				courseName: 'Astrophysik 2b',
				displayColor: '#ffb9b9',
				id: '59cce16281297026d02cdc49',
			}),
			new TaskResponseDto({
				title: 'solve world poverty',
				duedate: new Date(),
				courseName: 'Politics 2b',
				displayColor: '#ffbb00',
				id: '59cce16281297026d02cdc37',
			}),
		];
		return response;
	}
}
