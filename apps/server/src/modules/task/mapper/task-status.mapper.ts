import { ITaskStatus } from '@shared/domain/types/task.types';
import { TaskStatusResponse } from '../controller/dto/task-status.response';

export class TaskStatusMapper {
	static mapToResponse(status: ITaskStatus): TaskStatusResponse {
		const dto = new TaskStatusResponse(status);

		return dto;
	}
}
