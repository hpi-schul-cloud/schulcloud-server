import { ContentElementType, TaskElement } from '@shared/domain';
import { TaskElementContent, TaskElementResponse, TimestampsResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class TaskElementResponseMapper implements BaseResponseMapper {
	private static instance: TaskElementResponseMapper;

	public static getInstance(): TaskElementResponseMapper {
		if (!TaskElementResponseMapper.instance) {
			TaskElementResponseMapper.instance = new TaskElementResponseMapper();
		}

		return TaskElementResponseMapper.instance;
	}

	mapToResponse(element: TaskElement): TaskElementResponse {
		const result = new TaskElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.TASK,
			content: new TaskElementContent({ dueDate: element.dueDate }),
		});

		return result;
	}

	canMap(element: TaskElement): boolean {
		return element instanceof TaskElement;
	}
}
