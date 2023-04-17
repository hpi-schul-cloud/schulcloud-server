import { ITaskStatus } from '@shared/domain';
import { BoardTaskStatusResponse } from '../controller/dto';

export class BoardTaskStatusMapper {
	static mapToResponse(status: ITaskStatus): BoardTaskStatusResponse {
		const dto = new BoardTaskStatusResponse(status);

		if (status.taskCard.isCompleted) {
			dto.taskCard.isCompleted = status.taskCard.isCompleted;
		}

		if (status.taskCard.completedBy) {
			dto.taskCard.completedBy = status.taskCard.completedBy;
		}

		return dto;
	}
}
