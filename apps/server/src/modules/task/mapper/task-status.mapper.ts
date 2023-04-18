import { ITaskStatus } from '@shared/domain';
import { TaskStatusResponse } from '../controller/dto/task-status.response';

export class TaskStatusMapper {
	static mapToResponse(status: ITaskStatus): TaskStatusResponse {
		const dto = new TaskStatusResponse(status);

		return dto;
	}
}
