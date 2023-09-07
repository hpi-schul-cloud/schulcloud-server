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

	public mapToResponse(submissionItem: SubmissionItem): SubmissionItemResponse {
		const result = new SubmissionItemResponse({
			id: submissionItem.id,
			timestamps: new TimestampsResponse({
				lastUpdatedAt: submissionItem.updatedAt,
				createdAt: submissionItem.createdAt,
			}),
			completed: submissionItem.completed,
			userId: submissionItem.userId,
			caption: submissionItem.caption,
			description: {
				text: submissionItem.text,
				inputFormat: submissionItem.inputFormat,
			},
		});

		return result;
	}
}
