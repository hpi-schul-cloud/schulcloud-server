import { ContentElementType, SubmissionContainerElement } from '@shared/domain';
import { SubmissionContainerElementContent, SubmissionContainerElementResponse, TimestampsResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class SubmissionContainerContentElementResponseMapper implements BaseResponseMapper {
	private static instance: SubmissionContainerContentElementResponseMapper;

	public static getInstance(): SubmissionContainerContentElementResponseMapper {
		if (!SubmissionContainerContentElementResponseMapper.instance) {
			SubmissionContainerContentElementResponseMapper.instance = new SubmissionContainerContentElementResponseMapper();
		}

		return SubmissionContainerContentElementResponseMapper.instance;
	}

	mapToResponse(element: SubmissionContainerElement): SubmissionContainerElementResponse {
		const result = new SubmissionContainerElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.SUBMISSION_CONTAINER,
			content: new SubmissionContainerElementContent({ dueDate: element.dueDate }),
		});

		return result;
	}

	canMap(element: SubmissionContainerElement): boolean {
		return element instanceof SubmissionContainerElement;
	}
}
