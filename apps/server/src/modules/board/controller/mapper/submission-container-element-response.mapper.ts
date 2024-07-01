import { ContentElementType, SubmissionContainerElement } from '../../domain';
import { SubmissionContainerElementContent, SubmissionContainerElementResponse, TimestampsResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class SubmissionContainerElementResponseMapper implements BaseResponseMapper {
	private static instance: SubmissionContainerElementResponseMapper;

	public static getInstance(): SubmissionContainerElementResponseMapper {
		if (!SubmissionContainerElementResponseMapper.instance) {
			SubmissionContainerElementResponseMapper.instance = new SubmissionContainerElementResponseMapper();
		}

		return SubmissionContainerElementResponseMapper.instance;
	}

	mapToResponse(element: SubmissionContainerElement): SubmissionContainerElementResponse {
		const result = new SubmissionContainerElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.SUBMISSION_CONTAINER,
			content: new SubmissionContainerElementContent({
				dueDate: element.dueDate ?? null,
			}),
		});

		if (element.dueDate) {
			result.content = new SubmissionContainerElementContent({ dueDate: element.dueDate });
		}

		return result;
	}

	canMap(element: SubmissionContainerElement): boolean {
		return element instanceof SubmissionContainerElement;
	}
}
