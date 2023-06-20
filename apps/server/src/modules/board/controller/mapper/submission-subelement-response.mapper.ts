import { ContentSubElementType, SubmissionSubElement } from '@shared/domain';
import { SubmissionSubElementContent, SubmissionSubElementResponse, TimestampsResponse } from '../dto';

export class SubmissionSubElementResponseMapper {
	private static instance: SubmissionSubElementResponseMapper;

	public static getInstance(): SubmissionSubElementResponseMapper {
		if (!SubmissionSubElementResponseMapper.instance) {
			SubmissionSubElementResponseMapper.instance = new SubmissionSubElementResponseMapper();
		}

		return SubmissionSubElementResponseMapper.instance;
	}

	mapToResponse(subElement: SubmissionSubElement): SubmissionSubElementResponse {
		const result = new SubmissionSubElementResponse({
			id: subElement.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: subElement.updatedAt, createdAt: subElement.createdAt }),
			type: ContentSubElementType.SUBMISSION,
			content: new SubmissionSubElementContent({ completed: subElement.completed, userId: subElement.userId }),
		});

		return result;
	}

	canMap(element: SubmissionSubElement): boolean {
		return element instanceof SubmissionSubElement;
	}
}
