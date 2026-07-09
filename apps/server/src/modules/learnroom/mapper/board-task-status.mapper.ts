import { type TaskStatus } from '@modules/task';
import { BoardTaskStatusResponse } from '../controller/dto';

export class BoardTaskStatusMapper {
	public static mapToResponse(status: TaskStatus): BoardTaskStatusResponse {
		const dto = new BoardTaskStatusResponse(status);

		return dto;
	}
}
