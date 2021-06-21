/* istanbul ignore file */
// TODO add spec, see news.mapper.spec
import { TaskResponse } from '../controller/dto';
import { Task } from '../entity';

// TODO: look to task.uc has the same interface
export type ITaskSubmissionsMetaData = {
	submitted: number;
	maxSubmissions: number;
	graded: number;
};

export class TaskMapper {
	static mapToResponse(task: Task, status?: ITaskSubmissionsMetaData): TaskResponse {
		const dto = new TaskResponse();
		dto.id = task.id;
		dto.name = task.name;
		dto.duedate = task.dueDate;
		dto.courseName = task.course?.name;
		dto.displayColor = task.course?.color;
		dto.createdAt = task.createdAt;
		dto.updatedAt = task.updatedAt;
		dto.status = status || {};
		return dto;
	}
}
