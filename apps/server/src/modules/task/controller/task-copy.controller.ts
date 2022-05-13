import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@shared/controller/pipe';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { TaskCopyMapper } from '../mapper/task-copy.mapper';
import { TaskCopyUC } from '../uc/task-copy.uc';
import { TaskCopyApiParams } from './dto/task-copy.params';
import { TaskCopyApiResponse } from './dto/task-copy.response';

@ApiTags('TaskCopy')
@Authenticate('jwt')
@Controller('tasks/copy')
export class TaskCopyController {
	constructor(private readonly taskCopyUC: TaskCopyUC) {}

	@Post()
	async copy(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('id', ParseObjectIdPipe) taskId: string,
		@Body() params: TaskCopyApiParams
	): Promise<TaskCopyApiResponse> {
		const copyStatus = await this.taskCopyUC.copyTask(
			currentUser.userId,
			taskId,
			TaskCopyMapper.mapTaskCopyToDomain(params)
		);
		const dto = TaskCopyMapper.mapToResponse(copyStatus);
		return dto;
	}
}
