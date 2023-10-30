import { ITaskStatus } from '@shared/domain/types/task.types';
import { BoardTaskStatusResponse } from '../controller/dto/single-column-board/board-task-status.response';

export class BoardTaskStatusMapper {
	static mapToResponse(status: ITaskStatus): BoardTaskStatusResponse {
		const dto = new BoardTaskStatusResponse(status);

		return dto;
	}
}
