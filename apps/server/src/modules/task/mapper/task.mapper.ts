import { TaskWithStatusVo } from '@shared/domain';
import { TaskResponse } from '../controller/dto';
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
			createdAt: task.createdAt,
			updatedAt: task.updatedAt,
			status: statusDto,
		});

		dto.availableDate = task.availableDate;
		dto.duedate = task.dueDate;

		dto.displayColor = taskDesc.color;
		dto.description = taskDesc.lessonName;

		return dto;
	}
}
