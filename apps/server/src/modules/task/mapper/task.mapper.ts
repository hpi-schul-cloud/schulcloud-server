/* istanbul ignore file */
// TODO add spec, see news.mapper.spec
import { TaskResponse } from '../controller/dto';
import { Task } from '../entity';

export class TaskMapper {
	static mapToResponse(task: Task): TaskResponse {
		const dto = new TaskResponse();
		dto.id = task.id;
		dto.name = task.name;
		dto.duedate = task.dueDate;
		dto.courseName = task.course?.name;
		dto.displayColor = task.course?.color;
		dto.createdAt = task.createdAt;
		dto.updatedAt = task.updatedAt;
		dto.status = {
			submitted: task.submitted,
			maxSubmissions: task.maxSubmissions,
			graded: task.graded,

		}
		return dto;
	}
}
