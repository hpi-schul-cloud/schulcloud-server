import { ITaskStatus } from '@shared/domain';
import { TaskStatusResponse } from '../controller/dto/task-status.response';

export class TaskStatusMapper {
	static mapToResponse(status: ITaskStatus): TaskStatusResponse {
		const dto = new TaskStatusResponse();

		dto.submitted = status.submitted;
		dto.maxSubmissions = status.maxSubmissions;
		dto.graded = status.graded;
		dto.isDraft = status.isDraft;
		dto.isSubstitutionTeacher = status.isSubstitutionTeacher;

		return dto;
	}
}
