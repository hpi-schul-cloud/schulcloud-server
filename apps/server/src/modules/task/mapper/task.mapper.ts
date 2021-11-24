import { TaskWithStatusVo } from '@shared/domain';
import { TaskResponse } from '../controller/dto';

export class TaskMapper {
	static mapToResponse(taskWithStatus: TaskWithStatusVo): TaskResponse {
		const { task, status } = taskWithStatus;
		const dto = new TaskResponse({
			id: task.id,
			name: task.name,
			createdAt: task.createdAt,
			updatedAt: task.updatedAt,
			status: {
				submitted: status.submitted,
				maxSubmissions: status.maxSubmissions,
				graded: status.graded,
				isDraft: status.isDraft,
				isSubstitutionTeacher: status.isSubstitutionTeacher,
			},
		});

		dto.availableDate = task.availableDate;
		dto.duedate = task.dueDate;

		const taskDesc = task.getDescriptions();
		dto.courseName = taskDesc.name;
		dto.displayColor = taskDesc.color;
		dto.description = taskDesc.description;

		return dto;
	}
}
