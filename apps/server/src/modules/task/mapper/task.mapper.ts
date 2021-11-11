import { TaskWithStatusVo, Task } from '@shared/domain';
import { TaskResponse, FinishedTaskReponse } from '../controller/dto';

export class TaskMapper {
	static mapToResponse(taskWithStatus: TaskWithStatusVo): TaskResponse {
		const { task, status } = taskWithStatus;
		const dto = new TaskResponse();

		dto.id = task.id;
		dto.name = task.name;
		dto.availableDate = task.availableDate;
		dto.duedate = task.dueDate;
		dto.createdAt = task.createdAt;
		dto.updatedAt = task.updatedAt;
		dto.status = {
			submitted: status.submitted,
			maxSubmissions: status.maxSubmissions,
			graded: status.graded,
			isDraft: status.isDraft,
			isSubstitutionTeacher: status.isSubstitutionTeacher,
		};

		const taskDesc = task.getDescriptions();
		dto.courseName = taskDesc.name;
		dto.displayColor = taskDesc.color;
		dto.description = taskDesc.description;

		return dto;
	}

	static mapToFinishedResponse(task: Task): FinishedTaskReponse {
		const dto = new TaskResponse();

		dto.id = task.id;
		dto.name = task.name;
		dto.availableDate = task.availableDate;
		dto.duedate = task.dueDate;
		dto.createdAt = task.createdAt;
		dto.updatedAt = task.updatedAt;

		const taskDesc = task.getDescriptions();
		dto.courseName = taskDesc.name;
		dto.displayColor = taskDesc.color;
		dto.description = taskDesc.description;

		return dto;
	}
}
