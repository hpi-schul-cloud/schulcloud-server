import { InputFormat } from '@shared/domain/types';
import { RichText, type TaskCreate, type TaskUpdate } from '../../domain';
import { type TaskWithStatusVo } from '../../repo';
import { type TaskCreateParams, TaskResponse, type TaskUpdateParams } from '../dto';
import { TaskStatusMapper } from './task-status.mapper';

export class TaskMapper {
	public static mapToResponse(taskWithStatus: TaskWithStatusVo): TaskResponse {
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
		if (task.publicSubmissions) dto.publicSubmissions = true;
		if (task.teamSubmissions) dto.teamSubmissions = true;
		if (task.maxTeamMembers !== undefined) dto.maxTeamMembers = task.maxTeamMembers;

		dto.displayColor = taskDesc.color;
		if (task.lesson) dto.lessonId = task.lesson.id;
		if (taskDesc.lessonName) {
			dto.lessonName = taskDesc.lessonName;
		}
		dto.lessonHidden = taskDesc.lessonHidden;

		return dto;
	}

	public static mapTaskUpdateToDomain(params: TaskUpdateParams): TaskUpdate {
		const dto: TaskUpdate = {
			name: params.name,
			courseId: params.courseId,
			lessonId: params.lessonId,
			private: params.private,
			description: params.description,
			availableDate: params.availableDate,
			dueDate: params.dueDate,
			publicSubmissions: params.publicSubmissions,
			teamSubmissions: params.teamSubmissions,
			maxTeamMembers: params.maxTeamMembers,
		};
		if (params.description) {
			dto.descriptionInputFormat = InputFormat.RICH_TEXT_CK5_TASK;
		}
		return dto;
	}

	public static mapTaskCreateToDomain(params: TaskCreateParams): TaskCreate {
		const dto: TaskCreate = {
			name: params.name || 'Draft',
			courseId: params.courseId,
			lessonId: params.lessonId,
			private: params.private,
			description: params.description,
			availableDate: params.availableDate,
			dueDate: params.dueDate,
			publicSubmissions: params.publicSubmissions,
			teamSubmissions: params.teamSubmissions,
			maxTeamMembers: params.maxTeamMembers,
		};
		if (params.description) {
			dto.descriptionInputFormat = InputFormat.RICH_TEXT_CK5_TASK;
		}
		return dto;
	}
}
