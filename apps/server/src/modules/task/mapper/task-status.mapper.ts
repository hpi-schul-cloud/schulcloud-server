import { ITaskStatus } from '@shared/domain';
import { TaskStatusResponse } from '../controller/dto/task-status.response';

export class TaskStatusMapper {
	static mapToResponse(status: ITaskStatus): TaskStatusResponse {
		const dto = new TaskStatusResponse(status);

		if (status.taskCard.isCompleted) {
			dto.taskCard.isCompleted = status.taskCard.isCompleted;
		}

		if (status.taskCard.completedBy) {
			dto.taskCard.completedBy = status.taskCard.completedBy;
		}

		return dto;
	}
}
