import { TaskStatus } from '../../domain';
import { TaskStatusResponse } from '../dto';

export class TaskStatusMapper {
	static mapToResponse(status: TaskStatus): TaskStatusResponse {
		const dto = new TaskStatusResponse(status);

		return dto;
	}
}
