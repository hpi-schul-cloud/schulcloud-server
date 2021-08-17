/* istanbul ignore file */
// TODO add spec, see news.mapper.spec
import { TaskResponse } from '../controller/dto';
import { TaskWithSubmissionStatus } from '../domain';

export class TaskMapper {
	static mapToResponse(taskWithStatus: TaskWithSubmissionStatus): TaskResponse {
		const { task, status } = taskWithStatus;
		const dto = new TaskResponse();

		dto.id = task.id;
		dto.name = task.getName();
		dto.duedate = task.getDueDate();
		dto.createdAt = task.createdAt;
		dto.updatedAt = task.updatedAt;
		dto.status = status;

		const parent = task.getParent();
		if (parent !== undefined) {
			const parentData = parent.getDescriptions();
			dto.courseName = parentData.name;
			dto.displayColor = parentData.color;
		}

		return dto;
	}
}
