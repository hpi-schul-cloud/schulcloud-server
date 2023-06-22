import { ContentElementType, SubmissionContainerElement } from '@shared/domain';
import { SubmissionContainerElementContent, TaskElementResponse, TimestampsResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class TaskElementResponseMapper implements BaseResponseMapper {
	private static instance: TaskElementResponseMapper;

	public static getInstance(): TaskElementResponseMapper {
		if (!TaskElementResponseMapper.instance) {
			TaskElementResponseMapper.instance = new TaskElementResponseMapper();
		}

		return TaskElementResponseMapper.instance;
	}

	mapToResponse(element: SubmissionContainerElement): TaskElementResponse {
		const result = new TaskElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.TASK,
			content: new SubmissionContainerElementContent({ dueDate: element.dueDate }),
		});

		return result;
	}

	canMap(element: SubmissionContainerElement): boolean {
		return element instanceof SubmissionContainerElement;
	}
}
