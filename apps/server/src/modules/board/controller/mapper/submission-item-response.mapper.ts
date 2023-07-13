import { SubmissionItem } from '@shared/domain';
import { SubmissionItemResponse, TimestampsResponse } from '../dto';

export class SubmissionItemResponseMapper {
	private static instance: SubmissionItemResponseMapper;

	public static getInstance(): SubmissionItemResponseMapper {
		if (!SubmissionItemResponseMapper.instance) {
			SubmissionItemResponseMapper.instance = new SubmissionItemResponseMapper();
		}

		return SubmissionItemResponseMapper.instance;
	}

	public mapToResponse(submission: SubmissionItem): SubmissionItemResponse {
		const result = new SubmissionItemResponse({
			id: submission.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: submission.updatedAt, createdAt: submission.createdAt }),
			completed: submission.completed,
			userId: submission.userId,
		});

		return result;
	}
}
