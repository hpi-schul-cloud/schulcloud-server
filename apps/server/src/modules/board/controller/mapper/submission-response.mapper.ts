import { SubmissionSubElement } from '@shared/domain';
import { SubmissionBoard } from '@shared/domain/domainobject/board/submission-board.do';
import { SubmissionResponse, TimestampsResponse } from '../dto';

export class SubmissionResponseMapper {
	private static instance: SubmissionResponseMapper;

	public static getInstance(): SubmissionResponseMapper {
		if (!SubmissionResponseMapper.instance) {
			SubmissionResponseMapper.instance = new SubmissionResponseMapper();
		}

		return SubmissionResponseMapper.instance;
	}

	mapToResponse(submission: SubmissionBoard): SubmissionResponse {
		const result = new SubmissionResponse({
			id: submission.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: submission.updatedAt, createdAt: submission.createdAt }),
			completed: submission.completed,
			userId: submission.userId,
		});

		return result;
	}

	canMap(element: SubmissionSubElement): boolean {
		return element instanceof SubmissionSubElement;
	}
}
