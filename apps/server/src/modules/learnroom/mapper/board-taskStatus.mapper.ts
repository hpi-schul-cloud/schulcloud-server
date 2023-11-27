import { TaskStatus } from '@shared/domain';
import { BoardTaskStatusResponse } from '../controller/dto';

export class BoardTaskStatusMapper {
	static mapToResponse(status: TaskStatus): BoardTaskStatusResponse {
		const dto = new BoardTaskStatusResponse(status);

		return dto;
	}
}
