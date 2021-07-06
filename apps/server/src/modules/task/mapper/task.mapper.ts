/* istanbul ignore file */
// TODO add spec, see news.mapper.spec
import { TaskResponse } from '../controller/dto';
import { Task, COURSE_DEFAULT_COLOR, ISubmissionStatus } from '../entity';

export class TaskMapper {
	static mapToResponse(task: Task, status?: ISubmissionStatus): TaskResponse {
		const dto = new TaskResponse();
		dto.id = task.id;
		dto.name = task.name;
		dto.duedate = task.dueDate;
		dto.courseName = task.course?.name;
		dto.displayColor = task.course?.color || COURSE_DEFAULT_COLOR;
		dto.createdAt = task.createdAt;
		dto.updatedAt = task.updatedAt;
		dto.status = status || {};
		return dto;
	}
}
