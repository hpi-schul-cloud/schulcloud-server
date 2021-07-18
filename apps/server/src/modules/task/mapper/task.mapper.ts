/* istanbul ignore file */
// TODO add spec, see news.mapper.spec
import { TaskResponse } from '../controller/dto';
import { Task, ISubmissionStatus } from '../entity';

const COURSE_DEFAULT_COLOR = '#ACACAC';

export class TaskMapper {
	static mapToResponse(task: Task, status?: ISubmissionStatus): TaskResponse {
		const dto = new TaskResponse();
		dto.id = task.id;
		dto.name = task.name;
		dto.duedate = task.dueDate;
		dto.courseName = ''; // task.course?.name; // TODO: we need name
		dto.displayColor = COURSE_DEFAULT_COLOR; // TODO: we need color
		dto.createdAt = task.createdAt;
		dto.updatedAt = task.updatedAt;
		dto.status = status || {};
		return dto;
	}
}
