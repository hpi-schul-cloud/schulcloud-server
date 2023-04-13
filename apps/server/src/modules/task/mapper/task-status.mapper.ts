import { ITaskStatus } from '@shared/domain';
import { TaskStatusResponse } from '../controller/dto/task-status.response';

export class TaskStatusMapper {
	static mapToResponse(status: ITaskStatus): TaskStatusResponse {
		const dto = new TaskStatusResponse(status);

		if (status.isTaskCardCompleted) {
			dto.isTaskCardCompleted = status.isTaskCardCompleted;
		}

		if (status.taskCardCompleted) {
			dto.taskCardCompleted = status.taskCardCompleted;
		}

		return dto;
	}
}
