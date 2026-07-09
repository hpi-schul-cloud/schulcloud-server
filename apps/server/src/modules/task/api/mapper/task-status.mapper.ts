import { type TaskStatus } from '../../domain';
import { TaskStatusResponse } from '../dto';

export class TaskStatusMapper {
	public static mapToResponse(status: TaskStatus): TaskStatusResponse {
		const dto = new TaskStatusResponse(status);

		return dto;
	}
}
