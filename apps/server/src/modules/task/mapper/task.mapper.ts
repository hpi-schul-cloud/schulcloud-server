import { ITaskUpdate, TaskWithStatusVo } from '@shared/domain';
import { TaskResponse, TaskUpdateParams } from '../controller/dto';
import { TaskStatusMapper } from './task-status.mapper';

export class TaskMapper {
	static mapToResponse(taskWithStatus: TaskWithStatusVo): TaskResponse {
		const { task, status } = taskWithStatus;
		const taskDesc = task.getParentData();
		const statusDto = TaskStatusMapper.mapToResponse(status);

		const dto = new TaskResponse({
			id: task.id,
			name: task.name,
			courseName: taskDesc.courseName,
			courseId: taskDesc.courseId,
			createdAt: task.createdAt,
			updatedAt: task.updatedAt,
			lessonHidden: false,
			status: statusDto,
		});

		dto.availableDate = task.availableDate;
		dto.duedate = task.dueDate;

		dto.displayColor = taskDesc.color;
		dto.description = taskDesc.lessonName;
		dto.lessonHidden = taskDesc.lessonHidden;

		return dto;
	}

	static mapUpdateTaskToDomain(params: TaskUpdateParams): ITaskUpdate {
		const dto: ITaskUpdate = {
			name: params.name,
			courseId: params.courseId,
			lessonId: params.lessonId,
		};
		return dto;
	}
}
