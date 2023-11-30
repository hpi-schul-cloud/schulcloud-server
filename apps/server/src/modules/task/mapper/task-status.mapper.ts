import { TaskStatus } from '@shared/domain/types';
import { TaskStatusResponse } from '../controller/dto/task-status.response';

export class TaskStatusMapper {
	static mapToResponse(status: TaskStatus): TaskStatusResponse {
		const dto = new TaskStatusResponse(status);

		return dto;
	}
}
