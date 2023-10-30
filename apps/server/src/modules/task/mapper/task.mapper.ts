import { TaskWithStatusVo } from '@shared/domain/entity/task.entity';
import { InputFormat } from '@shared/domain/types/input-format.types';
import { RichText } from '@shared/domain/types/rich-text.types';
import { ITaskUpdate, ITaskCreate } from '@shared/domain/types/task.types';
import { TaskCreateParams } from '../controller/dto/task-create.params';
import { TaskUpdateParams } from '../controller/dto/task-update.params';
import { TaskResponse } from '../controller/dto/task.response';
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

	static mapTaskUpdateToDomain(params: TaskUpdateParams): ITaskUpdate {
		const dto: ITaskUpdate = {
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

	static mapTaskCreateToDomain(params: TaskCreateParams): ITaskCreate {
		const dto: ITaskCreate = {
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
