import { InputFormat } from '@shared/domain/types';
import { RichText, TaskCreate, TaskUpdate } from '../../domain';
import { TaskWithStatusVo } from '../../repo';
import { TaskCreateParams, TaskResponse, TaskUpdateParams } from '../dto';
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
		if (task.description) {
			dto.description = new RichText({
				content: task.description,
				type: task.descriptionInputFormat || InputFormat.RICH_TEXT_CK4,
			});
		}
		dto.availableDate = task.availableDate;
		dto.dueDate = task.dueDate;

		dto.displayColor = taskDesc.color;
		if (taskDesc.lessonName) {
			dto.lessonName = taskDesc.lessonName;
		}
		dto.lessonHidden = taskDesc.lessonHidden;

		return dto;
	}

	static mapTaskUpdateToDomain(params: TaskUpdateParams): TaskUpdate {
		const dto: TaskUpdate = {
			name: params.name,
			courseId: params.courseId,
			lessonId: params.lessonId,
			description: params.description,
			availableDate: params.availableDate,
			dueDate: params.dueDate,
		};
		if (params.description) {
			dto.descriptionInputFormat = InputFormat.RICH_TEXT_CK5;
		}
		return dto;
	}

	static mapTaskCreateToDomain(params: TaskCreateParams): TaskCreate {
		const dto: TaskCreate = {
			name: params.name || 'Draft',
			courseId: params.courseId,
			lessonId: params.lessonId,
			description: params.description,
			availableDate: params.availableDate,
			dueDate: params.dueDate,
		};
		if (params.description) {
			dto.descriptionInputFormat = InputFormat.RICH_TEXT_CK5;
		}
		return dto;
	}
}
